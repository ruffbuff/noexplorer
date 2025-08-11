import { Shield, Lock, Eye, Database, Code, Globe, Users, CheckCircle, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSEO } from "@/hooks/use-seo";

const Privacy = () => {
  useSEO({
    title: "Privacy Policy – Noexplorer Private Search",
    description: "Noexplorer's comprehensive privacy policy: zero data collection, complete transparency, and maximum user control.",
    canonical: "/privacy",
  });

  const lastUpdated = "August 2025";

  return (
    <main className="min-h-screen">
      <div className="container py-8 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete transparency about how Noexplorer protects your privacy and handles your data.
          </p>
          <Badge variant="secondary" className="mt-4">
            Last Updated: {lastUpdated}
          </Badge>
        </div>

        {/* Privacy Guarantees */}
        <Card className="mb-8 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-5 w-5" />
              Our Privacy Guarantees
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Zero data collection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">No tracking or analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">No cookies or identifiers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Client-side processing only</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">No user accounts required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Open-source transparency</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-8">
          
          {/* Information We Don't Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Information We Don't Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Noexplorer is designed with privacy as the foundation. We fundamentally do not collect, store, or transmit any personal information.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600 dark:text-red-400 flex items-center gap-2"><X className="h-4 w-4" />Never Collected</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Search queries or history</li>
                    <li>• IP addresses or location data</li>
                    <li>• Browser fingerprints</li>
                    <li>• Personal identifiers</li>
                    <li>• Usage analytics or metrics</li>
                    <li>• Account information</li>
                    <li>• Device information</li>
                    <li>• Behavioral patterns</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-green-600 dark:text-green-400 flex items-center gap-2"><Check className="h-4 w-4" />Local Only</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• User preferences & settings</li>
                    <li>• Theme and layout choices</li>
                    <li>• Search result cache (temporary)</li>
                    <li>• Language preferences</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How Noexplorer Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                How Noexplorer Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Noexplorer operates entirely within your browser using a client-side architecture that ensures your privacy.
              </p>
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-2">Search Process:</h4>
                <ol className="text-sm space-y-2 text-muted-foreground">
                  <li><strong>1. Your Query:</strong> Entered and processed entirely in your browser</li>
                  <li><strong>2. API Requests:</strong> Anonymous requests sent to public search APIs (MWMBL, DuckDuckGo, etc.)</li>
                  <li><strong>3. Result Processing:</strong> Results aggregated, deduplicated, and ranked locally</li>
                  <li><strong>4. Local Caching:</strong> Results temporarily cached in your browser for performance</li>
                  <li><strong>5. Display:</strong> Final results displayed with no tracking or logging</li>
                </ol>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Important:</strong> At no point in this process is your query or any identifying information sent to Noexplorer servers, 
                because Noexplorer doesn't have servers that log user data.
              </p>
            </CardContent>
          </Card>

          {/* Third-Party Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Third-Party Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Noexplorer aggregates results from multiple search engines to provide diverse, high-quality results. 
                Here's how we handle third-party interactions:
              </p>
              
              <div className="space-y-4">
                <div className="border border-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Search APIs Used:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-sm">MWMBL</p>
                      <p className="text-xs text-muted-foreground">Open-source search index</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">DuckDuckGo API</p>
                      <p className="text-xs text-muted-foreground">Privacy-focused instant answers</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Brave Search</p>
                      <p className="text-xs text-muted-foreground">Independent search suggestions</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Startpage</p>
                      <p className="text-xs text-muted-foreground">Privacy proxy for Google results</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Privacy Protection:</h4>
                  <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                    <li>• Your queries are sent directly from your browser to these APIs</li>
                    <li>• Noexplorer never sees or logs your search queries</li>
                    <li>• No user identification is sent with API requests</li>
                    <li>• Each API has their own privacy policy (generally privacy-focused)</li>
                    <li>• You can disable specific sources in settings if desired</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Local Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Local Data Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Noexplorer stores some data locally on your device to enhance your experience. This data never leaves your device.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-green-600 dark:text-green-400 flex items-center gap-2"><Check className="h-4 w-4" />Stored Locally</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• User preferences (theme, language)</li>
                    <li>• Search settings</li>
                    <li>• Temporary result cache</li>
                    <li>• Interface customizations</li>
                  </ul>
                </div>
                
                <div className="border border-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Your Control:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Clear all data anytime in settings</li>
                    <li>• Export/import your preferences</li>
                    <li>• Automatic cleanup options</li>
                    <li>• No data syncing across devices</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Technical Note:</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Local storage uses your browser's localStorage and IndexedDB. This data is stored on your device only 
                  and is not accessible to other websites or transmitted over the internet.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Legal Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Legal Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">GDPR Compliance</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Noexplorer is fully compliant with the EU General Data Protection Regulation (GDPR):
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• No personal data processing</li>
                    <li>• No consent required (no data collected)</li>
                    <li>• Right to erasure (clear local data)</li>
                    <li>• Data portability (export settings)</li>
                    <li>• Privacy by design architecture</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">CCPA Compliance</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    California Consumer Privacy Act (CCPA) compliance:
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• No personal information collected</li>
                    <li>• No selling of personal data</li>
                    <li>• Complete transparency</li>
                    <li>• User control over all data</li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Other Jurisdictions</h4>
                <p className="text-sm text-muted-foreground">
                  Noexplorer's zero-data-collection approach means we comply with privacy laws worldwide, 
                  including Brazil's LGPD, Canada's PIPEDA, and other national privacy regulations.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Transparency & Auditing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Transparency & Open Source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Noexplorer believes in complete transparency. Our commitment to privacy is backed by open-source code and public auditing.
              </p>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Open Source</h4>
                  <p className="text-sm text-muted-foreground">
                    Noexplorer's entire codebase is open source and publicly available. Anyone can inspect, 
                    audit, and verify our privacy claims by examining the source code.
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium mb-2">No Hidden Code</h4>
                  <p className="text-sm text-muted-foreground">
                    What you see is what you get. There are no hidden tracking scripts, analytics codes, 
                    or data collection mechanisms. Everything operates exactly as described in this policy.
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Community Oversight</h4>
                  <p className="text-sm text-muted-foreground">
                    Our open-source nature means thousands of developers can verify our privacy practices. 
                    Any changes to privacy handling would be immediately visible to the community.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Contact & Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you have any questions about this privacy policy or Noexplorer's privacy practices:
              </p>
              
              <div className="space-y-2">
                <p className="text-sm"><strong>GitHub Issues:</strong> Report privacy concerns or ask questions</p>
                <p className="text-sm"><strong>Code Review:</strong> Examine our source code for complete transparency</p>
                <p className="text-sm"><strong>Community:</strong> Join discussions about privacy and features</p>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Response Commitment:</strong> We'll respond to all privacy-related inquiries promptly. 
                  Since we don't collect any data, most questions can be answered by pointing to our open source code.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Policy Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                This privacy policy may be updated to reflect new features or legal requirements. 
                Here's how we handle policy changes:
              </p>
              
              <div className="space-y-2">
                <p className="text-sm"><strong>Version Control:</strong> All policy changes are tracked in our public repository</p>
                <p className="text-sm"><strong>Notification:</strong> Major changes will be announced on the main page</p>
                <p className="text-sm"><strong>Effective Date:</strong> Changes take effect immediately upon publication</p>
                <p className="text-sm"><strong>Your Choice:</strong> You can always stop using Noexplorer if you disagree with changes</p>
              </div>
              
              <div className="text-center pt-4">
                <Badge variant="outline">
                  Last update: {lastUpdated}
                </Badge>
              </div>
            </CardContent>
          </Card>

        </div>
        
        <Separator className="my-8" />
        
        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Noexplorer is committed to privacy, transparency, and user control. 
            This policy reflects our core values and technical architecture.
          </p>
          <p className="mt-2">
            <strong>Remember:</strong> The best privacy policy is not needing one because we don't collect your data.
          </p>
        </div>
      </div>
    </main>
  );
};

export default Privacy;