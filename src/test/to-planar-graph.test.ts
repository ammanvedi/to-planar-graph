import { getInputsFromGraphML } from './loader';
import { toPlanarGraph } from '../to-planar-graph';

describe('toPlanarGraph', () => {
    describe('When input contains a single edge cross event', () => {
        it('should return the correct result, creating one new vertex', () => {
            const [nodes, edges] = getInputsFromGraphML('g1.graphml');
            const res = toPlanarGraph(nodes, edges, 5);
            expect(res).toEqual({
                nodes: [
                    [699.75, 123],
                    [703.75, 4],
                    [859.75, 0],
                    [855.75, 136],
                    [633.75, 57],
                    [701.1621343607392, 80.98900276801078],
                ],
                edges: [
                    [1, 2],
                    [2, 3],
                    [3, 0],
                    [0, 5],
                    [5, 1],
                    [3, 5],
                    [5, 4],
                ],
            });
        });
    });
    describe('When input contains a single vertex cross event', () => {
        it('should return the correct result, creating no new vertices', () => {
            const [nodes, edges] = getInputsFromGraphML('g2.graphml');
            const res = toPlanarGraph(nodes, edges, 5);
            expect(res).toEqual({
                nodes: [
                    [699.75, 189],
                    [703.75, 70],
                    [859.75, 66],
                    [855.75, 202],
                    [621.75, 0],
                ],
                edges: [
                    [0, 1],
                    [1, 2],
                    [2, 3],
                    [3, 0],
                    [3, 1],
                    [1, 4],
                ],
            });
        });
    });
    describe('When input contains multiple line crosses', () => {
        it('should return the correct result, creating three new vertices', () => {
            const [nodes, edges] = getInputsFromGraphML('g3.graphml');
            const res = toPlanarGraph(nodes, edges, 5);
            expect(res).toEqual({
                nodes: [
                    [699.75, 123],
                    [703.75, 4],
                    [859.75, 0],
                    [855.75, 136],
                    [610.7499999999997, 50.00000000000006],
                    [931.1730769230769, 75.84615384615395],
                    [701.1373012644497, 81.72778738262326],
                    [857.6935557152216, 69.91910568246666],
                    [701.9564890345516, 57.356951222088526],
                ],
                edges: [
                    [1, 2],
                    [3, 0],
                    [0, 6],
                    [3, 6],
                    [6, 4],
                    [7, 5],
                    [2, 7],
                    [7, 3],
                    [4, 8],
                    [8, 7],
                    [6, 8],
                    [8, 1],
                ],
            });
        });
    });
    describe('When input contains an existing vertex cross event which causes a duplicate edge', () => {
        it('should return the correct result', () => {
            const [nodes, edges] = getInputsFromGraphML('g4.graphml');
            const res = toPlanarGraph(nodes, edges, 5);
            expect(res).toEqual({
                nodes: [
                    [681.7499999999995, 145.00000000000028],
                    [859.7499999999999, 147.0000000000003],
                    [860.7499999999999, 4.000000000000028],
                    [671.7499999999995, 0],
                    [1011.7500000000001, 11.000000000000057],
                ],
                edges: [
                    [0, 1],
                    [1, 2],
                    [3, 0],
                    [2, 3],
                    [2, 4],
                ],
            });
        });
    });
    describe('When input contains multiple vertex cross events', () => {
        it('should return the correct result', () => {
            const [nodes, edges] = getInputsFromGraphML('g5.graphml');
            const res = toPlanarGraph(nodes, edges, 5);
            expect(res).toEqual({
                nodes: [
                    [713.7499999999995, 258.00000000000045],
                    [922.75, 256.00000000000045],
                    [920.75, 99.00000000000017],
                    [703.7499999999995, 98.00000000000017],
                    [643.7499999999994, 53.000000000000114],
                    [570.7499999999993, 0],
                ],
                edges: [
                    [0, 1],
                    [1, 2],
                    [2, 3],
                    [3, 0],
                    [0, 4],
                    [4, 2],
                    [1, 3],
                    [3, 4],
                    [4, 5],
                ],
            });
        });
    });
    describe('When input contains multiple vertex cross events and multiple edge cross events', () => {
        it('should return the correct result', () => {
            const [nodes, edges] = getInputsFromGraphML('g6.graphml');
            const res = toPlanarGraph(nodes, edges, 5);
            expect(res).toEqual({
                nodes: [
                    [713.7499999999995, 258.00000000000045],
                    [922.75, 256.00000000000045],
                    [920.75, 99.00000000000017],
                    [703.7499999999995, 98.00000000000017],
                    [643.7499999999994, 53.000000000000114],
                    [570.7499999999993, 0],
                    [831.7499999999998, 133.00000000000023],
                    [883.7499999999999, 177.0000000000003],
                    [841.6842514438026, 197.0430919591296],
                    [799.9474989219489, 166.68909012505418],
                ],
                edges: [
                    [0, 1],
                    [1, 2],
                    [2, 3],
                    [3, 0],
                    [0, 4],
                    [4, 2],
                    [6, 2],
                    [2, 7],
                    [1, 8],
                    [0, 8],
                    [8, 7],
                    [8, 9],
                    [0, 9],
                    [9, 6],
                    [9, 3],
                    [3, 4],
                    [4, 5],
                ],
            });
        });
    });
});
