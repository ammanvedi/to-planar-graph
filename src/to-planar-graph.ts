export type Position = [number, number];

/**
 * We input nodes as a pair of values indicating the x and y position
 */
export type InputNode = Position;

/**
 * The index of the node in the array gives its ID
 */
export type InputNodes = Array<InputNode>;

/**
 * we input edges as a pair of number indicating the
 * source and destination of the edge
 */
export type InputEdge = [number, number];

export type InputEdges = Array<InputEdge>;