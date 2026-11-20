import { z } from "zod";

// The static site's CSP disallows eval, including Zod's JIT support probe.
z.config({ jitless: true });

export { z };
