import { InputSegment, OutputIntersection, OutputSegment, sweep } from 'isect';

const APPROX_ZERO = 1e-9;

/**
 * a 2d [x, y] coordinate position
 */
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

type ExtendedSegment = {
    fromId: number;
    toId: number;
};

const edgeToSegment = (
    edge: InputEdge,
    nodes: InputNodes,
): InputSegment<ExtendedSegment> | null => {
    const fromEntity = nodes[edge[0]];
    const toEntity = nodes[edge[1]];

    if (!fromEntity || !toEntity) {
        return null;
    }

    return {
        from: {
            x: fromEntity[0],
            y: fromEntity[1],
        },
        to: {
            x: toEntity[0],
            y: toEntity[1],
        },
        fromId: edge[0],
        toId: edge[1],
    };
};

const getInputSegmentsFromEdges = (
    edges: InputEdges,
    nodes: InputNodes,
): Array<InputSegment<ExtendedSegment>> => {
    return edges.reduce((acc, edge) => {
        const result = edgeToSegment(edge, nodes);
        return result ? [...acc, result] : acc;
    }, [] as Array<InputSegment<ExtendedSegment>>);
};

const getEdgesFromOutputSegments = (
    segments: Array<OutputSegment<ExtendedSegment>>,
): InputEdges => {
    return segments.map((s) => {
        return [s.fromId, s.toId];
    });
};

enum IntersectionType {
    NEW_VERTEX = 'NEW_VERTEX',
    EXISTING_VERTEX = 'EXISTING_VERTEX',
}

type NewVertexIntersection = {
    type: IntersectionType.NEW_VERTEX;
    edges: Array<InputEdge>;
    position: Position;
};

type ExistingVertexIntersection = {
    type: IntersectionType.EXISTING_VERTEX;
    edges: Array<InputEdge>;
    existingVertex: number;
};

type Intersection = NewVertexIntersection | ExistingVertexIntersection;

const isNearVertex = (
    v: InputNode,
    pos: Position,
    threshold: number,
): boolean => {
    const absX = Math.abs(v[0] - pos[0]);
    const absY = Math.abs(v[1] - pos[1]);

    return absX <= threshold && absY <= threshold;
};

const edgeInvolvesNode = (edge: InputEdge, node: number): boolean => {
    return edge[0] === node || edge[1] === node;
};

const getEdgeMapKey = (edge: InputEdge): string => {
    return `${edge[0]}->${edge[1]}`;
};

type EdgeKey = ReturnType<typeof getEdgeMapKey>;

const getEdgeMap = (edges: InputEdges): Map<EdgeKey, InputEdge> => {
    return new Map<EdgeKey, InputEdge>(edges.map((e) => [getEdgeMapKey(e), e]));
};

const buildIntersection = (
    intersection: OutputIntersection<ExtendedSegment>,
    nodes: InputNodes,
    vertexMatchThreshold: number,
): Intersection => {
    // Is the intersection near an existing vertex?
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (
            isNearVertex(
                node,
                [intersection.point.x, intersection.point.y],
                vertexMatchThreshold,
            )
        ) {
            return {
                type: IntersectionType.EXISTING_VERTEX,
                existingVertex: i,
                edges: getEdgesFromOutputSegments(intersection.segments).filter(
                    (e) => !edgeInvolvesNode(e, i),
                ),
            };
        }
    }

    // if there is no existing vertex we can route through then we
    // should create a new one
    return {
        type: IntersectionType.NEW_VERTEX,
        edges: getEdgesFromOutputSegments(intersection.segments),
        position: [intersection.point.x, intersection.point.y],
    };
};

const buildIntersectionsList = (
    libraryIntersections: Array<OutputIntersection<ExtendedSegment>>,
    nodes: InputNodes,
    vertexMatchThreshold: number,
): Array<Intersection> => {
    return libraryIntersections.map((i) =>
        buildIntersection(i, nodes, vertexMatchThreshold),
    );
};

const dist2 = (v: Position, w: Position): number => {
    return (v[0] - w[0]) ** 2 + (v[1] - w[1]) ** 2;
};

// https://stackoverflow.com/a/1501725
const distanceToLineSegment = (
    p: Position,
    v: Position,
    w: Position,
): number => {
    const l2 = dist2(v, w);
    if (l2 == 0) return dist2(p, v);
    let t =
        ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt(
        dist2(p, [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])]),
    );
};

const isOnLineSegment = (p: Position, v: Position, w: Position): boolean => {
    return distanceToLineSegment(p, v, w) <= APPROX_ZERO;
};

const getCorrectComponentOfSplitEdge = (
    edgeSplits: Array<EdgeKey>,
    edgeMap: Map<EdgeKey, InputEdge>,
    nodes: InputNodes,
    position: Position,
): Split | null => {
    let closest: Split | null = null;

    for (let i = 0; i < edgeSplits.length; i++) {
        const edge = edgeMap.get(edgeSplits[i]);

        if (!edge) {
            continue;
        }

        const from = nodes[edge[0]];
        const to = nodes[edge[1]];

        if (!from || !to) {
            continue;
        }

        const distance = distanceToLineSegment(position, from, to);

        if (
            closest === null ||
            (closest.type === SplitType.Split && distance < closest.distance)
        ) {
            closest = {
                type: SplitType.Split,
                id: getEdgeMapKey(edge),
                indexInSplitMap: i,
                distance,
            };
        }
    }

    return closest;
};

enum SplitType {
    ExistingUnsplit,
    Split,
}

type Split =
    | { type: SplitType.ExistingUnsplit; id: EdgeKey }
    | {
          type: SplitType.Split;
          indexInSplitMap: number;
          id: EdgeKey;
          distance: number;
      };

const getEdgeToSplit = (
    edgeSplitMap: Map<EdgeKey, Array<EdgeKey>>,
    edgeMap: Map<EdgeKey, InputEdge>,
    edge: EdgeKey,
    nodes: InputNodes,
    position: Position,
): Split | null => {
    if (edgeMap.get(edge)) {
        return { type: SplitType.ExistingUnsplit, id: edge };
    }

    const edgeSplits = edgeSplitMap.get(edge);
    if (edgeSplits) {
        return getCorrectComponentOfSplitEdge(
            edgeSplits,
            edgeMap,
            nodes,
            position,
        );
    }

    return null;
};

const sendEdgesViaVertex = (
    vertex: number,
    position: Position,
    nodes: InputNodes,
    augmentationEdgeMap: Map<EdgeKey, InputEdge>,
    edgeSplitMap: Map<EdgeKey, Array<EdgeKey>>,
    edgeMap: Map<EdgeKey, InputEdge>,
) => {
    for (const [id] of augmentationEdgeMap.entries()) {
        const splitCheckResult = getEdgeToSplit(
            edgeSplitMap,
            edgeMap,
            id,
            nodes,
            position,
        );

        if (!splitCheckResult) {
            continue;
        }

        const edge = edgeMap.get(splitCheckResult.id);

        if (!edge) {
            continue;
        }

        /**
         * First delete the old edge
         */
        edgeMap.delete(splitCheckResult.id);

        /**
         * These are the two new edges that will be created
         * to replace the one we just deleted
         */
        const splitA: InputEdge = [edge[0], vertex];

        const splitB: InputEdge = [vertex, edge[1]];

        /**
         * Add the edges to the graph
         */

        const aKey = getEdgeMapKey(splitA);
        const bKey = getEdgeMapKey(splitB);
        edgeMap.set(aKey, splitA);
        edgeMap.set(bKey, splitB);

        let existingSplitPath: Array<string> | null;
        /**
         * Now update the split edge map
         */

        switch (splitCheckResult.type) {
            case SplitType.ExistingUnsplit:
                /**
                 * This edge was not split before, now we need to create a new
                 * entry in the splitMap if we try to look up the id again
                 */
                edgeSplitMap.set(splitCheckResult.id, [aKey, bKey]);
                break;
            case SplitType.Split:
                /**
                 * This edge was split before so we need to update the edge
                 * split map entry at the correct points
                 *
                 * The split check returned id will be different to what we passed
                 */
                existingSplitPath = edgeSplitMap.get(id) || null;

                if (!existingSplitPath) {
                    break;
                }

                existingSplitPath.splice(
                    splitCheckResult.indexInSplitMap,
                    1,
                    aKey,
                    bKey,
                );

                edgeSplitMap.set(id, existingSplitPath);
                break;
        }
    }
};

const applyNewVertexAugmentation = (
    nodes: InputNodes,
    augmentation: NewVertexIntersection,
    edgeSplitMap: Map<EdgeKey, Array<EdgeKey>>,
    edgeMap: Map<EdgeKey, InputEdge>,
): InputNodes => {
    const augmentationEdgeMap = getEdgeMap(augmentation.edges);

    const newNode: InputNode = [...augmentation.position];
    const newNodes: InputNodes = [...nodes, newNode];

    sendEdgesViaVertex(
        newNodes.length - 1,
        augmentation.position,
        nodes,
        augmentationEdgeMap,
        edgeSplitMap,
        edgeMap,
    );

    return newNodes;
};

const applyExistingVertexAugmentation = (
    nodes: InputNodes,
    augmentation: ExistingVertexIntersection,
    edgeSplitMap: Map<EdgeKey, Array<EdgeKey>>,
    edgeMap: Map<EdgeKey, InputEdge>,
) => {
    const augmentationEdgeMap = getEdgeMap(augmentation.edges);

    sendEdgesViaVertex(
        augmentation.existingVertex,
        nodes[augmentation.existingVertex],
        nodes,
        augmentationEdgeMap,
        edgeSplitMap,
        edgeMap,
    );
};

export type AugmentationResult = {
    nodes: InputNodes;
    edges: InputEdges;
};

const applyAugmentations = (
    nodes: InputNodes,
    edges: InputEdges,
    augmentations: Array<Intersection>,
): AugmentationResult => {
    /**
     * OK so we essentially have a set of edges that intersect eachother
     * in the graph. And at each intersection we want to create a new edge
     * and have the old edges flow through it.
     *
     * Example. A->B and C->D intersect
     *
     * Ok so we create a new vertex E and then create the edges
     * A->E E->B C->E E->D
     *
     * Fine. Except now any other line that intersected A->B or C->D
     * is in trouble. Because they dont exist in the graph any more.
     *
     * So we maintain a mapping of the original edge and what it has
     * been split into. This way we can still look up the original edge
     * by its original id and work out from there where along the new edge
     * we need to make our insertion.
     */
    const edgeSplitMap = new Map<EdgeKey, Array<EdgeKey>>();
    const edgeMap = getEdgeMap(edges);
    let mutableNodes = [...nodes];
    augmentations.forEach((augmentation) => {
        switch (augmentation.type) {
            case IntersectionType.EXISTING_VERTEX:
                applyExistingVertexAugmentation(
                    mutableNodes,
                    augmentation,
                    edgeSplitMap,
                    edgeMap,
                );
                break;
            case IntersectionType.NEW_VERTEX:
                mutableNodes = applyNewVertexAugmentation(
                    mutableNodes,
                    augmentation,
                    edgeSplitMap,
                    edgeMap,
                );
                break;
        }
    });

    return {
        nodes: mutableNodes,
        edges: Array.from(edgeMap.values()),
    };
};

const removeDuplicateEdges = (edges: InputEdges): InputEdges => {
    const edgeMap = getEdgeMap(edges);

    edges.forEach((e) => {
        const id = getEdgeMapKey(e);
        const reverseId = getEdgeMapKey([e[1], e[0]]);

        if (edgeMap.get(id) && edgeMap.get(reverseId)) {
            edgeMap.delete(reverseId);
        }
    });

    return Array.from(edgeMap).map(([_, e]) => e);
};

const serializeIntersection = (i: Intersection): string => {
    return JSON.stringify(i);
};

const removeDuplicateAugmentations = (
    augmentations: Array<Intersection>,
): Array<Intersection> => {
    return Array.from(
        new Map(
            augmentations.map((a) => [serializeIntersection(a), a]),
        ).values(),
    );
};

export const toPlanarGraph = (
    nodes: InputNodes,
    _edges: InputEdges,
    vertexMatchThreshold: number,
): AugmentationResult => {
    /**
     * If we are given an undirected graph, make sure we convert it to a
     * directed graph
     */
    const edges = removeDuplicateEdges(_edges);
    const segments = getInputSegmentsFromEdges(edges, nodes);
    const intersections = sweep<ExtendedSegment>(segments).run();
    const intersectionsList = buildIntersectionsList(
        intersections,
        nodes,
        vertexMatchThreshold,
    );
    const filteredIntersectionList = intersectionsList.filter(
        (a) => a.edges.length > 0,
    );
    const graphAugmentations = removeDuplicateAugmentations(
        filteredIntersectionList,
    );
    const { nodes: augmentedNodes, edges: augmentedEdges } = applyAugmentations(
        nodes,
        edges,
        graphAugmentations,
    );
    const dedupedEdges = removeDuplicateEdges(augmentedEdges);

    return {
        nodes: augmentedNodes,
        edges: dedupedEdges,
    };
};
