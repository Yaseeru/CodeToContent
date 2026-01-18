import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';
import { Analysis, IAnalysis, IRawSignals } from '../models/Analysis';
import { Repository } from '../models/Repository';
import { GITHUB_CONFIG, MONITORING_CONFIG } from '../config/constants';
import { GitHubService, GitHubCommit, GitHubPullRequest, GitHubContent } from './GitHubService';

export interface AnalysisResult {
     problemStatement: string;
     targetAudience: string;
     coreFunctionality: string[];
     notableFeatures: string[];
     recentChanges: string[];
     integrations: string[];
     valueProposition: string;
}

export interface RepositorySignals {
     readme: string;
     commits: GitHubCommit[];
     pullRequests: GitHubPullRequest[];
     fileStructure: GitHubContent[];
     packageJson: any | null;
}

export class AnalysisService {
     private ai: GoogleGenAI;
     private apiKey: string;

     constructor(apiKey: string) {
          this.apiKey = apiKey;
          this.ai = new GoogleGenAI({ apiKey });
     }

     /**
      * Orchestrate repository analysis
      */
     async analyzeRepository(
          repositoryId: string,
          userId: string,
          githubAccessToken: string
     ): Promise<IAnalysis> {
          // Fetch repository from database
          const repository = await Repository.findById(repositoryId);
          if (!repository) {
               throw new Error('Repository not found');
          }

          // Parse owner and repo name from fullName (format: "owner/repo")
          const [owner, repo] = repository.fullName.split('/');
          if (!owner || !repo) {
               throw new Error('Invalid repository fullName format');
          }

          // Initialize GitHub service
          const githubService = new GitHubService(githubAccessToken);

          // Fetch repository data
          const signals = await this.collectRepositorySignals(githubService, owner, repo);

          // Construct prompt for Gemini API
          const prompt = this.constructAnalysisPrompt(signals, repository.name, repository.description);

          // Call Gemini API
          const analysisResult = await this.callGeminiAPI(prompt);

          // Parse AI response
          const parsedAnalysis = this.parseGeminiResponse(analysisResult);

          // Prepare raw signals for storage
          const rawSignals: IRawSignals = {
               readmeLength: signals.readme.length,
               commitCount: signals.commits.length,
               prCount: signals.pullRequests.length,
               fileStructure: signals.fileStructure.map(f => f.path),
          };

          // Save to MongoDB
          const analysis = new Analysis({
               repositoryId: new mongoose.Types.ObjectId(repositoryId),
               userId: new mongoose.Types.ObjectId(userId),
               problemStatement: parsedAnalysis.problemStatement,
               targetAudience: parsedAnalysis.targetAudience,
               coreFunctionality: parsedAnalysis.coreFunctionality,
               notableFeatures: parsedAnalysis.notableFeatures,
               recentChanges: parsedAnalysis.recentChanges,
               integrations: parsedAnalysis.integrations,
               valueProposition: parsedAnalysis.valueProposition,
               rawSignals,
          });

          await analysis.save();

          // Update repository's lastAnalyzed timestamp
          repository.lastAnalyzed = new Date();
          await repository.save();

          return analysis;
     }

     /**
      * Collect repository signals from GitHub
      */
     async collectRepositorySignals(
          githubService: GitHubService,
          owner: string,
          repo: string
     ): Promise<RepositorySignals> {
          // Fetch all data in parallel for efficiency
          const [readme, commits, pullRequests, fileStructure, packageJson] = await Promise.all([
               githubService.fetchRepositoryReadme(owner, repo),
               githubService.fetchCommitHistory(owner, repo, 50),
               githubService.fetchPullRequests(owner, repo, 'all', 30),
               githubService.fetchFileStructure(owner, repo),
               githubService.fetchPackageJson(owner, repo),
          ]);

          return {
               readme,
               commits,
               pullRequests,
               fileStructure,
               packageJson,
          };
     }

     /**
      * Construct structured prompt for Gemini API
      */
     private constructAnalysisPrompt(
          signals: RepositorySignals,
          repoName: string,
          repoDescription: string
     ): string {
          // Extract recent commit messages
          const recentCommitMessages = signals.commits
               .slice(0, GITHUB_CONFIG.RECENT_COMMITS_FOR_ANALYSIS)
               .map(c => `- ${c.commit.message.split('\n')[0]}`)
               .join('\n');

          // Extract recent PR titles and descriptions
          const recentPRs = signals.pullRequests
               .slice(0, GITHUB_CONFIG.RECENT_PRS_FOR_ANALYSIS)
               .map(pr => `- ${pr.title}${pr.body ? ': ' + pr.body.substring(0, 100) : ''}`)
               .join('\n');

          // Extract file structure (top-level files and directories)
          const fileStructureSummary = signals.fileStructure
               .map(f => `- ${f.name} (${f.type})`)
               .join('\n');

          // Extract dependencies from package.json if available
          let dependenciesInfo = '';
          if (signals.packageJson && signals.packageJson.dependencies) {
               const deps = Object.keys(signals.packageJson.dependencies).slice(0, GITHUB_CONFIG.DEPENDENCIES_DISPLAY_LIMIT);
               dependenciesInfo = `\n\nKey Dependencies:\n${deps.map(d => `- ${d}`).join('\n')}`;
          }

          const prompt = `You are an expert code analyst. Analyze the following GitHub repository and provide a structured summary.

Repository: ${repoName}
Description: ${repoDescription || 'No description provided'}

README Content (first ${GITHUB_CONFIG.README_TRUNCATION_LIMIT} chars):
${signals.readme.substring(0, GITHUB_CONFIG.README_TRUNCATION_LIMIT)}

Recent Commits:
${recentCommitMessages || 'No commits found'}

Recent Pull Requests:
${recentPRs || 'No pull requests found'}

File Structure:
${fileStructureSummary}${dependenciesInfo}

Based on this information, provide a comprehensive analysis in the following JSON format:
{
  "problemStatement": "What problem does this repository solve? (1-2 sentences)",
  "targetAudience": "Who is this for? (developers, end-users, specific industry, etc.)",
  "coreFunctionality": ["List 3-5 main features or capabilities"],
  "notableFeatures": ["List 2-4 standout capabilities or unique aspects"],
  "recentChanges": ["List 2-4 recent additions or updates based on commits/PRs"],
  "integrations": ["List APIs, tools, frameworks, or AI models used"],
  "valueProposition": "Why is this interesting or valuable? (1-2 sentences)"
}

Respond ONLY with valid JSON. Do not include any markdown formatting or code blocks.`;

          return prompt;
     }

     /**
      * Call Gemini API with analysis prompt
      */
     private async callGeminiAPI(prompt: string): Promise<string> {
          try {
               const response = await this.ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
               });

               if (!response.text) {
                    throw new Error('Gemini API returned empty response');
               }

               return response.text;
          } catch (error: any) {
               if (error.message?.includes('429')) {
                    throw new Error('Gemini API rate limit exceeded. Please try again later.');
               }
               if (error.message?.includes('401') || error.message?.includes('API key')) {
                    throw new Error('Invalid Gemini API key.');
               }
               throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
          }
     }

     /**
      * Parse Gemini response into structured Summary
      */
     private parseGeminiResponse(response: string): AnalysisResult {
          try {
               // Remove markdown code blocks if present
               let cleanedResponse = response.trim();
               if (cleanedResponse.startsWith('```json')) {
                    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
               } else if (cleanedResponse.startsWith('```')) {
                    cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
               }

               const parsed = JSON.parse(cleanedResponse);

               // Validate required fields
               if (!parsed.problemStatement || typeof parsed.problemStatement !== 'string') {
                    throw new Error('Missing or invalid problemStatement');
               }
               if (!parsed.targetAudience || typeof parsed.targetAudience !== 'string') {
                    throw new Error('Missing or invalid targetAudience');
               }
               if (!Array.isArray(parsed.coreFunctionality) || parsed.coreFunctionality.length === 0) {
                    throw new Error('Missing or invalid coreFunctionality');
               }
               if (!Array.isArray(parsed.notableFeatures)) {
                    throw new Error('Missing or invalid notableFeatures');
               }
               if (!Array.isArray(parsed.recentChanges)) {
                    throw new Error('Missing or invalid recentChanges');
               }
               if (!Array.isArray(parsed.integrations)) {
                    throw new Error('Missing or invalid integrations');
               }
               if (!parsed.valueProposition || typeof parsed.valueProposition !== 'string') {
                    throw new Error('Missing or invalid valueProposition');
               }

               return {
                    problemStatement: parsed.problemStatement,
                    targetAudience: parsed.targetAudience,
                    coreFunctionality: parsed.coreFunctionality,
                    notableFeatures: parsed.notableFeatures,
                    recentChanges: parsed.recentChanges,
                    integrations: parsed.integrations,
                    valueProposition: parsed.valueProposition,
               };
          } catch (error) {
               if (error instanceof SyntaxError) {
                    throw new Error(`Failed to parse Gemini response as JSON: ${error.message}`);
               }
               throw error;
          }
     }

     /**
      * Retrieve existing analysis for a repository
      */
     async getAnalysis(repositoryId: string, userId: string): Promise<IAnalysis | null> {
          const analysis = await Analysis.findOne({
               repositoryId: new mongoose.Types.ObjectId(repositoryId),
               userId: new mongoose.Types.ObjectId(userId),
          }).sort({ createdAt: -1 }); // Get most recent analysis

          return analysis;
     }
}
