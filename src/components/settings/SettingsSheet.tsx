import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Search, Shield, Monitor, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useSearchSettings,
  usePrivacySettings, 
  useInterfaceSettings,
  usePerformanceSettings 
} from "@/store/settingsStore";

interface SettingsSheetProps {
  children?: React.ReactNode;
}

const SettingsSheet = ({ children }: SettingsSheetProps) => {
  const [open, setOpen] = useState(false);
  
  // Get settings from stores
  const { search, updateSearchSettings } = useSearchSettings();
  const { privacy, updatePrivacySettings } = usePrivacySettings();
  const { interface: ui, updateInterfaceSettings } = useInterfaceSettings();
  const { performance, updatePerformanceSettings } = usePerformanceSettings();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </SheetTitle>
          <SheetDescription>
            Configure your search experience and privacy preferences.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="search" className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                Search
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="interface" className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                Interface
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Performance
              </TabsTrigger>
            </TabsList>

            {/* Search Settings */}
            <TabsContent value="search" className="space-y-6 mt-6">
              <div>
                <Label>Results per Page</Label>
                <Select 
                  value={search.resultsPerPage.toString()} 
                  onValueChange={(value) => updateSearchSettings({ resultsPerPage: parseInt(value) })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 results</SelectItem>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="20">20 results</SelectItem>
                    <SelectItem value="50">50 results</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Number of search results per page
                </p>
              </div>

              <div className="rounded-lg p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  Search Engine: MWMBL
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Using the open-source, community-driven MWMBL search index for all queries.
                </p>
              </div>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy" className="space-y-6 mt-6">

              <div className="flex items-center justify-between">
                <div>
                  <Label>Anonymous Analytics</Label>
                  <p className="text-sm text-muted-foreground">Help improve the service anonymously</p>
                </div>
                <Switch 
                  checked={privacy.anonymizeTelemetry} 
                  onCheckedChange={(checked) => updatePrivacySettings({ anonymizeTelemetry: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Search Analytics</Label>
                  <p className="text-sm text-muted-foreground">Track search performance metrics</p>
                </div>
                <Switch 
                  checked={privacy.trackSearchAnalytics} 
                  onCheckedChange={(checked) => updatePrivacySettings({ trackSearchAnalytics: checked })}
                />
              </div>

              <Separator />

              <div className="rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Privacy First
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Noexplorer never stores your personal data, IP addresses, or search queries on our servers. 
                  All settings are saved locally on your device.
                </p>
              </div>
            </TabsContent>

            {/* Interface Settings */}
            <TabsContent value="interface" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Domain Info</Label>
                  <p className="text-sm text-muted-foreground">Display website domains in results</p>
                </div>
                <Switch 
                  checked={ui.showDomainInfo} 
                  onCheckedChange={(checked) => updateInterfaceSettings({ showDomainInfo: checked })}
                />
              </div>

              <div className="rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  🎨 Theme Control
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Use the theme toggle in the navigation bar to switch between Light, Dark, and System themes.
                </p>
              </div>
            </TabsContent>

            {/* Performance Settings */}
            <TabsContent value="performance" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Caching</Label>
                  <p className="text-sm text-muted-foreground">Cache search results for faster loading</p>
                </div>
                <Switch 
                  checked={performance.enableCaching} 
                  onCheckedChange={(checked) => updatePerformanceSettings({ enableCaching: checked })}
                />
              </div>

              <div className="rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                  <Zap className="h-4 w-4 inline mr-1" />Performance Features
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                  Current optimizations:
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside space-y-1">
                  <li>Client-side result caching</li>
                  <li>Intelligent pagination</li>
                  <li>Lightweight MWMBL integration</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
