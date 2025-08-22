import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Score, SubmitScoreInput } from '../../server/src/schema';

function App() {
  const [leaderboard, setLeaderboard] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  
  const [formData, setFormData] = useState<SubmitScoreInput>({
    player_name: '',
    score: 0
  });

  const [playerBestScore, setPlayerBestScore] = useState<Score | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getLeaderboard.query({ limit: 10 });
      setLeaderboard(result);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPlayerBestScore = useCallback(async (playerName: string) => {
    if (!playerName.trim()) {
      setPlayerBestScore(null);
      return;
    }
    try {
      const result = await trpc.getPlayerBestScore.query(playerName);
      setPlayerBestScore(result);
    } catch (error) {
      console.error('Failed to load player best score:', error);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPlayerBestScore(formData.player_name);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [formData.player_name, loadPlayerBestScore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.player_name.trim() || formData.score < 0) {
      setSubmitMessage('❌ Please enter a valid player name and score');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');
    
    try {
      await trpc.submitScore.mutate(formData);
      setSubmitMessage(`🎉 Score submitted successfully for ${formData.player_name}!`);
      
      // Reload leaderboard and player best score
      loadLeaderboard();
      loadPlayerBestScore(formData.player_name);
      
      // Reset score but keep player name
      setFormData(prev => ({ ...prev, score: 0 }));
    } catch (error) {
      console.error('Failed to submit score:', error);
      setSubmitMessage('❌ Failed to submit score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '🏅';
    }
  };

  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">🐍 Snake Game Scoreboard</h1>
          <p className="text-green-600 text-lg">Submit your high scores and compete with players worldwide!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Score Submission Form */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                🎯 Submit Your Score
              </CardTitle>
              <CardDescription>
                Enter your player name and latest Snake game score
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Player Name
                  </label>
                  <Input
                    placeholder="Enter your name"
                    value={formData.player_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: SubmitScoreInput) => ({ ...prev, player_name: e.target.value }))
                    }
                    className="border-green-200 focus:border-green-400"
                    required
                    maxLength={50}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Score
                  </label>
                  <Input
                    type="number"
                    placeholder="Your score"
                    value={formData.score}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: SubmitScoreInput) => ({ ...prev, score: parseInt(e.target.value) || 0 }))
                    }
                    className="border-green-200 focus:border-green-400"
                    min="0"
                    required
                  />
                </div>

                {/* Player's Best Score Display */}
                {formData.player_name.trim() && playerBestScore && (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>{formData.player_name}'s Best:</strong> {formatScore(playerBestScore.score)} points
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                >
                  {isSubmitting ? '🔄 Submitting...' : '🚀 Submit Score'}
                </Button>
              </form>

              {submitMessage && (
                <div className={`mt-4 p-3 rounded-md ${
                  submitMessage.includes('❌') 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {submitMessage}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="border-yellow-200 shadow-lg">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                🏆 Global Leaderboard
              </CardTitle>
              <CardDescription>
                Top 10 Snake masters from around the world
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  <p className="mt-2">Loading leaderboard...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">🎮 No scores yet!</p>
                  <p className="text-sm mt-2">Be the first to submit a score and claim the top spot!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((score: Score, index: number) => (
                    <div key={score.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getRankEmoji(index)}</span>
                        <div>
                          <p className="font-semibold text-gray-800">{score.player_name}</p>
                          <p className="text-xs text-gray-500">
                            {score.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={index < 3 ? "default" : "secondary"} className="text-lg font-bold">
                          {formatScore(score.score)}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">#{index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <Separator className="my-8" />
        <div className="text-center text-gray-500 text-sm">
          <p>🐍 Keep playing, keep improving! Good luck climbing the leaderboard! 🚀</p>
        </div>
      </div>
    </div>
  );
}

export default App;