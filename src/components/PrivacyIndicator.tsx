import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, Eye, EyeOff, Lock, Globe, Zap } from 'lucide-react';
import { usePrivacySettings } from '@/store/settingsStore';
import { cn } from '@/lib/utils';

interface PrivacyIndicatorProps {
  className?: string;
  showText?: boolean;
  compact?: boolean;
}

const PrivacyIndicator = ({ className, showText = true, compact = false }: PrivacyIndicatorProps) => {
  const { privacy } = usePrivacySettings();

  // Calculate privacy score (0-100)
  const getPrivacyScore = (): number => {
    let score = 0;
    
    // Base privacy level
    switch (privacy.privacyLevel) {
      case 'standard': score += 20; break;
      case 'enhanced': score += 40; break;
      case 'maximum': score += 60; break;
      case 'paranoid': score += 80; break;
    }
    
    // Additional features
    if (privacy.rotateUserAgent) score += 5;
    if (privacy.randomizeRequestTiming) score += 5;
    if (privacy.enableTrafficObfuscation) score += 5;
    if (privacy.useProxy) score += 5;
    if (privacy.enableDnsOverHttps) score += 3;
    if (privacy.enableFakeQueries) score += 2;
    
    return Math.min(100, score);
  };

  const getPrivacyLevel = () => {
    const score = getPrivacyScore();
    if (score >= 80) return { level: 'Maximum', color: 'green', icon: Shield };
    if (score >= 60) return { level: 'High', color: 'blue', icon: Lock };
    if (score >= 40) return { level: 'Medium', color: 'yellow', icon: EyeOff };
    if (score >= 20) return { level: 'Basic', color: 'orange', icon: Eye };
    return { level: 'Low', color: 'red', icon: Globe };
  };

  const getActiveFeatures = (): string[] => {
    const features: string[] = [];
    
    if (privacy.rotateUserAgent) features.push('User-Agent Rotation');
    if (privacy.randomizeRequestTiming) features.push('Request Timing Randomization');
    if (privacy.enableTrafficObfuscation) features.push('Traffic Obfuscation');
    if (privacy.useProxy) features.push(`${privacy.proxyType.toUpperCase()} Proxy`);
    if (privacy.enableDnsOverHttps) features.push('DNS-over-HTTPS');
    if (privacy.enableFakeQueries) features.push('Fake Query Generation');
    if (!privacy.enableCookies) features.push('Cookie Blocking');
    if (!privacy.trackSearchAnalytics) features.push('No Analytics Tracking');
    
    return features;
  };

  const privacyInfo = getPrivacyLevel();
  const activeFeatures = getActiveFeatures();
  const score = getPrivacyScore();
  const Icon = privacyInfo.icon;

  const badgeVariant = 
    privacyInfo.color === 'green' ? 'default' :
    privacyInfo.color === 'blue' ? 'secondary' :
    privacyInfo.color === 'yellow' ? 'outline' :
    'destructive';

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={badgeVariant}
              className={cn("flex items-center gap-1 cursor-help", className)}
            >
              <Icon className="h-3 w-3" />
              {score}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-sm">
            <div className="space-y-2">
              <div className="font-medium">
                Privacy Level: {privacyInfo.level} ({score}%)
              </div>
              {activeFeatures.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-1">Active Features:</div>
                  <ul className="text-xs space-y-1">
                    {activeFeatures.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={badgeVariant}
            className={cn(
              "flex items-center gap-1.5 cursor-help px-2.5 py-1",
              className
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {showText && (
              <span className="text-xs font-medium">
                Privacy: {privacyInfo.level}
              </span>
            )}
            <span className="text-xs opacity-75">
              {score}%
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-md">
          <div className="space-y-3">
            <div>
              <div className="font-medium text-sm mb-1">
                Privacy Protection: {privacyInfo.level} Level
              </div>
              <div className="text-xs text-muted-foreground">
                Overall privacy score: {score}/100
              </div>
            </div>
            
            {activeFeatures.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Active Protection Features:</div>
                <div className="grid grid-cols-1 gap-1">
                  {activeFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                      <div className="w-1 h-1 bg-green-500 rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground border-t pt-2">
              Configure more privacy features in Settings → Privacy
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PrivacyIndicator;