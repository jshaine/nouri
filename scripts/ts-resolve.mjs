// Lets `node scripts/*.ts` import src/domain, whose imports omit the ".ts"
// extension (Vite style). Node's type stripping needs explicit extensions, so
// this hook retries unresolved relative imports with ".ts". No dependencies.
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});
