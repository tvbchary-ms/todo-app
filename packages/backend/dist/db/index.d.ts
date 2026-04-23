import * as schema from "./schema.js";
export declare function getDb(): import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: import("pg").Pool;
};
export declare function closeDb(): Promise<void>;
export { schema };
//# sourceMappingURL=index.d.ts.map