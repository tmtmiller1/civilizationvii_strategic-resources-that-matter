// Dev-only ambient typings for the Civilization VII UI runtime globals the mod calls. There is no official .d.ts;
// these are written from the mod's own call sites. Opaque engine returns are `any` on purpose: the engine boundary
// is untyped, and the mod's own data shapes are typed in the modules that build them. Not shipped.

export {};

declare global {
  type EngineHandle = any;

  /** A table of the game database as the UI sees it: iterable rows plus lookup by type name, index or hash. */
  interface GameInfoTable<Row> extends Iterable<Row> {
    lookup(key: string | number): Row | null | undefined;
    [key: string]: any;
  }

  const GameInfo: {
    Units: GameInfoTable<{ UnitType: string; Name: string; [key: string]: any }>;
    Resources: GameInfoTable<{ ResourceType: string; Name: string; $hash: number; [key: string]: any }>;
    TypeTags?: Iterable<{ Type: string; Tag: string }>;
    ModifierArguments?: Iterable<{ ModifierId: string; Name: string; Value: string }>;
    [key: string]: any;
  };

  const Players: {
    get(id: number): EngineHandle;
    getAlive(): EngineHandle[];
    [key: string]: any;
  };

  const Units: {
    get(id: EngineHandle): EngineHandle;
    [key: string]: any;
  };

  const Game: {
    turn: number;
    [key: string]: any;
  };

  const GameContext: {
    localPlayerID: number;
    [key: string]: any;
  };

  const Configuration: {
    getGame(): { isAnyMultiplayer: boolean; getValue(key: string): unknown; [key: string]: any };
    [key: string]: any;
  };

  const Locale: {
    compose(key: string, ...args: unknown[]): string;
    [key: string]: any;
  };

  const engine: {
    on(event: string, handler: (...args: any[]) => void, context?: unknown): void;
    off(event: string, handler: (...args: any[]) => void, context?: unknown): void;
    whenReady: Promise<void>;
    [key: string]: any;
  };

  const Controls: {
    decorate(name: string, factory: (component: any) => object): void;
    [key: string]: any;
  };

  const UI: EngineHandle;
}
