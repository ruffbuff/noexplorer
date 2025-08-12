import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Globe, 
  Clock, 
  Activity, 
  Zap, 
  Lock,
  RefreshCw,
  Settings
} from 'lucide-react';
import { usePrivacySettings } from '@/store/settingsStore';
import { userAgentRotator } from '@/lib/privacy/userAgentRotator';
import { trafficObfuscator } from '@/lib/privacy/trafficObfuscation';
import { dnsResolver, benchmarkDNSProviders } from '@/lib/privacy/dnsResolver';

interface PrivacyStats {
  userAgentRotations: number;
  requestsObfuscated: number;
  fakeQueriesGenerated: number;
  dnsQueriesCached: number;
  averageDelay: number;
  privacyScore: number;
}

const PrivacyDashboard = () => {
  const { privacy, updatePrivacySettings } = usePrivacySettings();
  const [stats, setStats] = useState<PrivacyStats>({
    userAgentRotations: 0,
    requestsObfuscated: 0,
    fakeQueriesGenerated: 0,
    dnsQueriesCached: 0,
    averageDelay: 0,
    privacyScore: 0
  });
  const [dnsProviders, setDnsProviders] = useState<Array<{
    provider: { name: string; url: string; supportsTLS: boolean; location: string; privacy: string };
    responseTime: number;
    success: boolean;
  }>>([]);
  const [testing, setTesting] = useState(false);

  // Calculate privacy score
  const calculatePrivacyScore = (): number => {
    let score = 0;
    
    switch (privacy.privacyLevel) {
      case 'standard': score += 20; break;
      case 'enhanced': score += 40; break;
      case 'maximum': score += 60; break;
      case 'paranoid': score += 80; break;
    }
    
    if (privacy.rotateUserAgent) score += 5;
    if (privacy.randomizeRequestTiming) score += 5;
    if (privacy.enableTrafficObfuscation) score += 5;
    if (privacy.useProxy) score += 5;
    if (privacy.enableDnsOverHttps) score += 3;
    if (privacy.enableFakeQueries) score += 2;
    if (!privacy.enableCookies) score += 2;
    if (!privacy.trackSearchAnalytics) score += 3;
    
    return Math.min(100, score);
  };

  // Update stats
  const updateStats = () => {
    const userAgentStats = userAgentRotator.getUsageStats();
    const trafficStats = trafficObfuscator.getStats();
    const dnsStats = dnsResolver.getCacheStats();
    
    setStats({
      userAgentRotations: userAgentStats.reduce((sum, stat) => sum + stat.count, 0),
      requestsObfuscated: trafficStats.fakeQueriesEnabled ? 10 : 0, // Placeholder
      fakeQueriesGenerated: trafficStats.fakeQueriesEnabled ? 5 : 0, // Placeholder
      dnsQueriesCached: dnsStats.size,
      averageDelay: (privacy.minRequestDelay + privacy.maxRequestDelay) / 2,
      privacyScore: calculatePrivacyScore()
    });
  };

  // Test DNS providers
  const testDnsProviders = async () => {
    setTesting(true);
    try {
      const results = await benchmarkDNSProviders('google.com');
      setDnsProviders(results);
    } catch (error) {
      console.error('DNS benchmark failed:', error);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [privacy]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return Shield;
    if (score >= 60) return Lock;
    if (score >= 40) return EyeOff;
    return Eye;
  };

  const ScoreIcon = getScoreIcon(stats.privacyScore);

  return (
    <div className="space-y-6">
      {/* Privacy Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScoreIcon className={`h-5 w-5 ${getScoreColor(stats.privacyScore)}`} />
            Privacy Protection Status
          </CardTitle>
          <CardDescription>
            Your current privacy and anonymity protection level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Privacy Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(stats.privacyScore)}`}>
                  {stats.privacyScore}/100
                </span>
              </div>
              <Progress value={stats.privacyScore} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Based on active privacy features and settings
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {privacy.privacyLevel.charAt(0).toUpperCase() + privacy.privacyLevel.slice(1)}
                </div>
                <div className="text-xs text-muted-foreground">Privacy Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.userAgentRotations}
                </div>
                <div className="text-xs text-muted-foreground">UA Rotations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.averageDelay}ms
                </div>
                <div className="text-xs text-muted-foreground">Avg Delay</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.dnsQueriesCached}
                </div>
                <div className="text-xs text-muted-foreground">DNS Cached</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Protection Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">User-Agent Rotation</span>
                <Badge variant={privacy.rotateUserAgent ? "default" : "secondary"}>
                  {privacy.rotateUserAgent ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Request Timing Randomization</span>
                <Badge variant={privacy.randomizeRequestTiming ? "default" : "secondary"}>
                  {privacy.randomizeRequestTiming ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Traffic Obfuscation</span>
                <Badge variant={privacy.enableTrafficObfuscation ? "default" : "secondary"}>
                  {privacy.enableTrafficObfuscation ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fake Query Generation</span>
                <Badge variant={privacy.enableFakeQueries ? "default" : "secondary"}>
                  {privacy.enableFakeQueries ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">DNS-over-HTTPS</span>
                <Badge variant={privacy.enableDnsOverHttps ? "default" : "secondary"}>
                  {privacy.enableDnsOverHttps ? "Active" : "Inactive"}
                </Badge>
              </div>
              {privacy.useProxy && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Proxy ({privacy.proxyType.toUpperCase()})</span>
                  <Badge variant="default">Active</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              DNS Provider
            </CardTitle>
            <CardDescription>
              Current DNS-over-HTTPS provider and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{privacy.dnsResolver}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={testDnsProviders}
                    disabled={testing}
                  >
                    {testing ? (
                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Zap className="h-3 w-3 mr-1" />
                    )}
                    Test Speed
                  </Button>
                </div>
                {privacy.dnsResolver === 'custom' && privacy.customDnsUrl && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {privacy.customDnsUrl}
                  </p>
                )}
              </div>

              {dnsProviders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Provider Performance:</h4>
                  {dnsProviders.slice(0, 3).map((result, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{result.provider.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {result.responseTime}ms
                        </span>
                        <Badge 
                          variant={result.success ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {result.success ? "OK" : "Failed"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Recommendations */}
      {stats.privacyScore < 80 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Recommendations
            </CardTitle>
            <CardDescription>
              Suggestions to improve your privacy protection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!privacy.rotateUserAgent && (
                <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <span className="text-sm">Enable User-Agent rotation</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updatePrivacySettings({ rotateUserAgent: true })}
                  >
                    Enable
                  </Button>
                </div>
              )}
              {!privacy.randomizeRequestTiming && (
                <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <span className="text-sm">Enable request timing randomization</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updatePrivacySettings({ randomizeRequestTiming: true })}
                  >
                    Enable
                  </Button>
                </div>
              )}
              {!privacy.enableDnsOverHttps && (
                <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <span className="text-sm">Enable DNS-over-HTTPS</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updatePrivacySettings({ enableDnsOverHttps: true })}
                  >
                    Enable
                  </Button>
                </div>
              )}
              {privacy.privacyLevel === 'standard' && (
                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <span className="text-sm">Upgrade to Enhanced privacy level</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updatePrivacySettings({ privacyLevel: 'enhanced' })}
                  >
                    Upgrade
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PrivacyDashboard;