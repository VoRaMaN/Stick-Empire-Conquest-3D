// Bundled by build.mjs into vendor/supabase.<hash>.js (an IIFE). The game's own scripts never use ES module
// imports: they reach the SDK through this one global, and only for online play.
import { createClient } from '@supabase/supabase-js';
window.SE3DSupabase = { createClient };
