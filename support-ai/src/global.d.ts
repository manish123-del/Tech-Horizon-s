// global.d.ts
// Provide basic Node.js types for the Next.js project so that
// `process.env` and other globals are recognized by TypeScript.

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    OPENAI_API_KEY?: string;
    FLAGGED_WEBHOOK_URL?: string;
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_WHATSAPP_FROM?: string;
    // add additional env vars used throughout the app here
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

// fallback declarations for packages without installed types
// these keep TypeScript happy until proper type packages are added.

declare module "next/server" {
  // simplified shims so Next.js typings aren't required in this environment.
  // we only call NextResponse.json() from our routes.
  export type NextRequest = any;
  export class NextResponse {
    static json(body: any, init?: any): any;
  }
}

declare module "twilio";
