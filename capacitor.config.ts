/**
 * Stage 15 Mobile Packaging Configuration for Capacitor (iOS & Android).
 * Kept dependency-free so `tsc --noEmit` compiles cleanly without requiring
 * `@capacitor/cli` in the web runtime bundle.
 */
export interface ViceLinkCapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server: {
    url: string;
    cleartext: boolean;
  };
  ios: {
    scheme: string;
    contentInset: "automatic" | "scrollableAxes" | "never" | "always";
    backgroundColor: string;
  };
  android: {
    backgroundColor: string;
    allowMixedContent: boolean;
  };
  plugins: {
    SplashScreen: {
      launchShowDuration: number;
      backgroundColor: string;
      showSpinner: boolean;
    };
    StatusBar: {
      style: "DARK" | "LIGHT";
      backgroundColor: string;
    };
    NativePurchases: {
      iosProvider: "StoreKit2";
      androidProvider: "GooglePlayBilling";
      products: {
        streetPass: string;
        kingpinVip: string;
      };
    };
  };
}

const config: ViceLinkCapacitorConfig = {
  appId: "app.vicelink.leonida",
  appName: "ViceLink",
  webDir: "out",
  server: {
    url: "https://vicelink.app",
    cleartext: false
  },
  ios: {
    scheme: "ViceLink",
    contentInset: "automatic",
    backgroundColor: "#05070e"
  },
  android: {
    backgroundColor: "#05070e",
    allowMixedContent: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: "#05070e",
      showSpinner: false
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#05070e"
    },
    NativePurchases: {
      iosProvider: "StoreKit2",
      androidProvider: "GooglePlayBilling",
      products: {
        streetPass: "app.vicelink.leonida.street_pass",
        kingpinVip: "app.vicelink.leonida.kingpin_vip"
      }
    }
  }
};

export default config;
