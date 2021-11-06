# To Planar Graph

This library aims to solve the following problem;

Given a graph embedded in a 2d coordinate space, and the embedding is not [planar](https://en.wikipedia.org/wiki/Planar_graph), make changes to the graph such that after the changes the graph is planar.
The Changes that will be made conform to the following

1. Do not change the position of any of the vertices.
2. Do not change the positions or directions of any of the edges.

The changes may;

1. Add new vertices at intersection points of edges.
2. Re route edges that cross over vertices.

## Installation

`npm install --save to-planar-graph`

## Usage

```typescript

import { toPlanarGraph } from "to-planar-graph";

/**
 * Nodes are defined as a coordinate position. Their "id" used
 * in edges is their index in the input
 * 
 * You can see more examples in the tests.
 */
const nodes: Array<[number, number]> = [
    [10, 10],
    [70, 50],
    [80, 70],
    ...
]

/**
 * Edges are defined by [source id, target id]
 */
const edges: Array<[number, number]> = [
    [0, 1],
    [1, 3],
    [1, 2],
    ...
]

const threshold = 5;

const result = toPlanarGraph(nodes, edges, threshold)

```

### About the "Threshold"

Consider the following graph as input

![](https://i.imgur.com/9j4WJqH.png)

The graph is clearly not planar. We could say this because of one of two reasons

1. The edge B->E intersects the edge A->C
2. The edge B->E intersects the vertex C

Now in the first scenario we would create a new vertex F, and then create the path B->F->E and A->F->C

But this may not be very good when we display our graph visually, even if logically it may be correct. We would end up with a graph where a vertex overlaps another.

![](https://i.imgur.com/1MpMtNi.png)

To avoid this we can check each intersection for its proximity to a vertex, this is what the threshold describes. If a vertex
is found within `threshold` the new edges will be routed through the edge that is within the threshold
distance.

It is suggested that the size of this threshold is the radius of the display size of the vertices in your coordinate system. For example if you show your vertices as 10 pixel squares a 
sensible threshold may be 5 (pixels).

## Acknowledgements

The intersections are performed using the [Bentley-Ottmann](https://en.wikipedia.org/wiki/Bentley%E2%80%93Ottmann_algorithm) algorithm from the [isect](https://www.npmjs.com/package/isect) library, its very cool and fast too

I built this library for use alongside [planar-face-discovery](https://www.npmjs.com/package/planar-face-discovery)