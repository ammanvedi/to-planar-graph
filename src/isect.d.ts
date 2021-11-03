declare module 'isect' {
    export type ISectPosition = {
        x: number;
        y: number;
    };

    export type OutputSegment<SEGMENT_META extends MetaBase> = {
        dy: number;
        dx: number;
        angle: number;
    } & InputSegment<SEGMENT_META>;

    export type OutputIntersection<SEGMENT_META extends MetaBase> = {
        point: ISectPosition;
        segments: Array<OutputSegment<SEGMENT_META>>;
    };

    export type MetaBase = Record<string, any>;

    export type InputSegment<SEGMENT_META extends MetaBase> = {
        from: ISectPosition;
        to: ISectPosition;
    } & SEGMENT_META;

    export type FunctionResult<SEGMENT_META extends MetaBase> = {
        run: () => Array<OutputIntersection<SEGMENT_META>>;
    };

    export type Options<SEGMENT_META extends MetaBase> = {
        onError?: () => void;
        onFound?: (intersection: OutputIntersection<SEGMENT_META>) => void;
    };

    export function sweep<SEGMENT_META extends MetaBase = MetaBase>(
        segments: Array<InputSegment<SEGMENT_META>>,
        opt?: Options<SEGMENT_META>,
    ): FunctionResult<SEGMENT_META>;
    export function brute<SEGMENT_META extends MetaBase = MetaBase>(
        segments: Array<InputSegment<SEGMENT_META>>,
        opt?: Options<SEGMENT_META>,
    ): FunctionResult<SEGMENT_META>;
    export function bush<SEGMENT_META extends MetaBase = MetaBase>(
        segments: Array<InputSegment<SEGMENT_META>>,
        opt?: Options<SEGMENT_META>,
    ): FunctionResult<SEGMENT_META>;
}
