import { Tweet, ContentFormat, IContent } from '../Content';
import mongoose from 'mongoose';

describe('Content Model - TypeScript Types', () => {
     describe('Tweet Interface', () => {
          it('should have correct Tweet interface structure', () => {
               const tweet: Tweet = {
                    text: 'This is a tweet',
                    position: 1,
                    characterCount: 15,
               };

               expect(tweet.text).toBe('This is a tweet');
               expect(tweet.position).toBe(1);
               expect(tweet.characterCount).toBe(15);
          });

          it('should allow creating array of tweets', () => {
               const tweets: Tweet[] = [
                    { text: 'Tweet 1', position: 1, characterCount: 7 },
                    { text: 'Tweet 2', position: 2, characterCount: 7 },
                    { text: 'Tweet 3', position: 3, characterCount: 7 },
               ];

               expect(tweets).toHaveLength(3);
               expect(tweets[0].position).toBe(1);
               expect(tweets[2].position).toBe(3);
          });
     });

     describe('ContentFormat Type', () => {
          it('should accept valid content format values', () => {
               const single: ContentFormat = 'single';
               const miniThread: ContentFormat = 'mini_thread';
               const fullThread: ContentFormat = 'full_thread';

               expect(single).toBe('single');
               expect(miniThread).toBe('mini_thread');
               expect(fullThread).toBe('full_thread');
          });
     });

     describe('IContent Interface', () => {
          it('should allow tweets to be undefined for single posts', () => {
               // This test verifies TypeScript compilation
               // The tweets field should be optional
               const contentData: Partial<IContent> = {
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'Single post text',
                    editedText: '',
                    version: 1,
                    // tweets is intentionally omitted - should compile fine
               };

               expect(contentData.tweets).toBeUndefined();
          });

          it('should allow tweets array for thread posts', () => {
               const tweets: Tweet[] = [
                    { text: 'Tweet 1', position: 1, characterCount: 7 },
                    { text: 'Tweet 2', position: 2, characterCount: 7 },
                    { text: 'Tweet 3', position: 3, characterCount: 7 },
               ];

               const contentData: Partial<IContent> = {
                    platform: 'x',
                    contentFormat: 'mini_thread',
                    generatedText: tweets.map(t => t.text).join('\n\n'),
                    editedText: '',
                    tweets,
                    version: 1,
               };

               expect(contentData.tweets).toBeDefined();
               expect(contentData.tweets).toHaveLength(3);
          });

          it('should validate tweet structure matches interface', () => {
               const tweet: Tweet = {
                    text: 'Test tweet with proper length',
                    position: 1,
                    characterCount: 30,
               };

               // Verify all required fields are present
               expect(tweet).toHaveProperty('text');
               expect(tweet).toHaveProperty('position');
               expect(tweet).toHaveProperty('characterCount');

               // Verify types
               expect(typeof tweet.text).toBe('string');
               expect(typeof tweet.position).toBe('number');
               expect(typeof tweet.characterCount).toBe('number');
          });
     });
});
