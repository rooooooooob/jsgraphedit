"use strict";

function destinationOnly(u, v)
{
	return v;
}

function wholeEdge(u , v)
{
	return [u, v];
}

function dfs(G, start, processEdge)
{
	var order = [processEdge(-1, start)];
	var visited = new Array(G.list.length);
	visited.fill(false);
	visited[start] = true;
	
	dfsInternal(G, start, order, visited, processEdge);
	
	return order;
}

function dfsComponents(G, processEdge)
{
	var order = [];
	var visited = new Array(G.list.length);
	visited.fill(false);
	
	for (var i = 0; i < G.list.length; ++i)
	{
		if (!visited[i])
		{
			visited[i] = true;
			var compOrder = [processEdge(-1, i)];
			dfsInternal(G, i, compOrder, visited, processEdge);
			order.push(compOrder);
		}
	}
	
	return order;
}

function dfsInternal(G, u, order, visited, processEdge)
{
	for (var i = 0; i < G.list[u].length; ++i)
	{
		const v = G.list[u][i];
		if (!visited[v])
		{
			visited[v] = true;
			order.push(processEdge(u, v));
			dfsInternal(G, v, order, visited, processEdge);
		}
	}
}

function bfs(G, start, processEdge)
{
	var order = [];
	var visited = new Array(G.list.length);
	visited.fill(false);
	bfsInternal(G, start, order, visited, processEdge);
	return order;
}

function bfsComponents(G, processEdge)
{
	var order = [];
	var visited = new Array(G.list.length);
	visited.fill(false);
	
	for (var i = 0; i < G.list.length; ++i)
	{
		if (!visited[i])
		{
			visited[i] = true;
			var compOrder = [];
			bfsInternal(G, i, compOrder, visited, processEdge);
			order.push(compOrder);
		}
	}
	
	return order;
}

function bfsInternal(G, start, order, visited, processEdge)
{
	var queue = new CircularQueue(G.list.length);
	function visit(u, v)
	{
		queue.push(v);
		visited[v] = true;
		order.push(processEdge(u, v));
	}
	visit(-1, start);
	while (queue.length() > 0)
	{
		const u = queue.pop();
		for (var i = 0; i < G.list[u].length; ++i)
		{
			const v = G.list[u][i];
			if (!visited[v])
			{
				visit(u, v);
			}
		}
	}
}

function vertexColouring(G)
{	
	var colours = new Array(G.list.length);
	function backtrack(k, order, orderIndex)
	{
		if (orderIndex >= order.length)
		{
			return true;
		}
		const u = order[orderIndex];
		var bannedColours = new Array(k);
		bannedColours.fill(false);
		for (var i = 0; i < G.list[u].length; ++i)
		{
			const c = colours[G.list[u][i]];
			if (c != -1)
			{
				bannedColours[c] = true;
			}
		}
		// loop through all colours and assign first unused one
		for (var i = 0; i < k; ++i)
		{
			if (!bannedColours[i])
			{
				colours[u] = i;
				if (backtrack(k, order, orderIndex + 1))
				{
					return true;
				}
				colours[u] = -1;
			}
		}
		return false;
	}
	var order = bfsComponents(G, destinationOnly);
	// visit every component in BFS order to minimize the amount of 
	// uncoloured neighbors at every step
	for (var component = 0; component < order.length; ++component)
	{
		for (var k = 1; k <= G.list.length; ++k)
		{
			// mark ONLY the colours in this component as uncoloured
			for (var i = 0; i < order[component].length; ++i)
			{
				colours[order[component][i]] = -1;
			}
			if (backtrack(k, order[component], 0))
			{
				break;
			}
		}
	}
	return colours;
}

function isConnected(G)
{
	return dfs(G, 0, destinationOnly).length == G.list.length;
}

function isCut(G, u)
{
	if (G.list[u].length < 2)
	{
		return false;
	}
	var order = [u];
	var visited = new Array(G.list.length);
	for (var i = 0; i < G.list.length; ++i)
	{
		visited[i] = false;
	}
	visited[u] = true;
	
	// mark u as visited then start dfs at one of its neighbors
	// which will only visit the entire component if u was non-cut
	dfsInternal(G, G.list[u][0], order, visited, destinationOnly);
	
	return dfs(G, u, destinationOnly).length != order.length;
}

function countEdges(G)
{
	var degsum = 0;
	for (var i = 0; i < G.list.length; ++i)
	{
		degsum += G.list[i].length;
	}
	return degsum / 2;
}

function isTree(G)
{
	return isConnected(G) && G.list.length == countEdges(G) + 1;
}

function hasCycles(G)
{
	var visited = new Array(G.list.length);
	visited.fill(false);
	function dfs(G, u, last)
	{
		visited[u] = true;
		for (var i = 0; i < G.list[u].length; ++i)
		{
			const v = G.list[u][i];
			if (v != last && visited[v])
			{
				return true;
			}
			if (!visited[v] && dfs(G, v, u))
			{
				return true;
			}
		}
		return false;
	}
	for (var i = 0; i < G.list.length; ++i)
	{
		if (!visited[i] && dfs(G, i, i))
		{
			return true;
		}
	}
	return false;
}

function twopathDecompose(G)
{
	var paths = [];	
	// make a copy since this algorithm is destructive
	var H = cloneGraph(G);
	
	// keep track of what vertex in g corresponds to what vertex in vertices
	// so we can return proper indices at the end
	var gtov = new Array(H.list.length);
	for (var i = 0; i < H.list.length; ++i)
	{
		gtov[i] = i;
	}
	
	while (countEdges(H) >= 2)
	{
		var u = -1;
		var v = -1
		var w = -1;
		var found = false;
		// two cases -  one there is a non-cut vertex with degree 2 or more
		for (var i = 0; i < H.list.length; ++i)
		{
			if (!isCut(H, i))
			{
				if (H.list[i].length >= 2)
				{
					u = H.list[i][0];
					v = i;
					w = H.list[i][1];
					found = true;
					break;
				}
			}
		}
		// and the other - all non-cut vertices have degree 1
		if (!found)
		{	
			// in any connected graph with at least 1 cut vertex there exists a cut vertex v
			// (and there must be a cut vertex since we know all non-cut vertices have a
			// degree of 1, yet such a graph can't be connected for n > 2)
			// such that all blocks in the graph containing that vertex are end-blocks
			// and end block -> exactly 1 cut vertex, which means that the only end-blocks
			// in our graph are star graphs, which we can simply choose any 2 leafs in the star
			// and use that - the only time this wouldn't work is when v is adjacent to only
			// 1 end-block. Now consider the non-end-block block that v is adjacent to.
			// v is adjacent to at least 2 vertices in this non-end block, and this non-end-block
			// is a non-separable subgraph, so if they are on a common cycle, so we can easily
			// remove the edge from v to one of them and use it.
			for (var i = 0; !found && i < H.list.length; ++i)
			{
				// so check for leaves - we know that a v is adjacent to a leaf if it's in
				// more than 2 components, so try them all
				if (H.list[i].length == 1)
				{
					var x = H.list[i][0];
					if (H.list[x].length == 2)
					{
						u = i;
						v = x;
						w = i == H.list[x][1] ? H.list[x][0] : H.list[x][1];
						found = true;
					}
					for (var j = 0; !found && j < H.list[x].length; ++j)
					{
						if (i != H.list[x][j] && H.list[H.list[x][j]].length == 1)
						{
							u = i;
							v = x;
							w = H.list[x][j];
							found = true;
						}
					}
				}
			}
			// now we know that we must find a vertex adjacent to a leaf that we can remove 1
			// of its incident edges without alternting the number of components
			var isolated = 0;
			var componentSize = -1;
			for (var i = 0; i < H.list.length; ++i)
			{
				if (H.list[i].length == 0)
				{
					++isolated;
				}
				else if (componentSize == -1)
				{
					componentSize = dfs(H, i, destinationOnly).length;
				}
			}
			if (H.list.length != isolated + componentSize)
			{
				alert("H needs to be connected besides isolated vertices - something went wrong");
			}
			if (!found)
			{
				for (var i = 0; !found && i < H.list.length; ++i)
				{
					if (H.list[i].length == 1)
					{
						x = H.list[i][0];
						for (var j = 0; !found && j < H.list[x].length; ++j)
						{
							const y = H.list[x][j];
							if (i != y)
							{
								removeEdge(H, x, y);
								if (componentSize == dfs(H, x, destinationOnly).length)
								{
									u = i;
									v = x;
									w = y;
									found = true;
								}
								addEdge(H, x, y);
							}
						}
					}
				}
			}
		}
		
		
		if (!found)
		{
			exportToList();
			alert(":(");
			return paths;
		}
		//else alert("removed " + gtov[u] + ", " + gtov[v] + ", " + gtov[w]);
		
		paths.push([[gtov[u], gtov[v]], [gtov[v], gtov[w]]]);
		
		removeEdge(H, u, v);
		removeEdge(H, v, w);
		// function removeIfIsolated(g, vertex)
		// {
			// if (g[vertex].length == 0)
			// {
				// const newV = removeVertex(g, vertex);
				// gtov[newV] = vertex;
			// }
		// }
		// removeIfIsolated(g, u);
		// removeIfIsolated(g, v);
		// removeIfIsolated(g, w);
		
		redraw();
		
	}
	return paths;
}

function isTreeIgnoreIsolatedVertices(G)
{
	var isolated = 0;
	var lastCheckedComponentSize = 0;
	for (var i = 0; i < G.list.length; ++i)
	{
		if (G.listG.list[i].length == 0)
		{
			++isolated;
		}
	}
	for (var i = 0; i < G.list.length; ++i)
	{
		if (G.list[i].length > 0)
		{
			lastCheckedComponentSize = dfs(G, i, destinationOnly).length;
			break;
		}
	}
	return G.list.length - isolated == lastCheckedComponentSize  // connected (besides isolated)
	    && G.list.length - isolated == countEdges(G) + 1; // right amount of edges for a tree
}
function cyclesToOutput(cycles)
{
	var output = [];
	for (var cycle in cycles)
	{
		output.push(cycles[cycle]);
	}
	return output;
}

function computeMinCycles(G)
{
	var cycles = {};
	
	const n = G.list.length;
	
	var girth = n;
	
	for (var i = 0; i < n; ++i)
	{
		const cyclesAtVertex = computeMinCyclesAt(G, i, girth);
		if (cyclesAtVertex.length > 0 && cyclesAtVertex[0].length <= girth)
		{
			if (cyclesAtVertex[0].length < girth)
			{
				cycles = {};
				girth = cyclesAtVertex[0].length;
			}
			for (var j = 0; j < cyclesAtVertex.length; ++j)
			{
				cycles[cyclesAtVertex[j].toString()] = cyclesAtVertex[j];
			}
		}
	}
	return cyclesToOutput(cycles);
}

function computeMinCyclesAt(G, root, girth)
{
	var visited = new Array(G.list.length);
	visited.fill(false);
	var stack = [];
	var cycles = {};
	function backtrack(G, u)
	{
		visited[u] = true;
		stack.push(u);
		for (var i = 0; i < G.list[u].length; ++i)
		{
			const v = G.list[u][i];
			if (stack.length > 2 && v == root)
			{
				if (stack.length < girth)
				{
					cycles = {};
					girth = stack.length;
				}
				const canonical = canonicalFormCycle(stack);
				cycles[canonical.toString()] = canonical;
				//alert("found cycle of length " + girth + " from vertex " + root);
				continue;
			}
			if (!visited[v] && stack.length < girth)
			{
				backtrack(G, v);
			}
		}
		stack.pop();
		visited[u] = false;
	}
	backtrack(G, root);
	return cyclesToOutput(cycles);
}

function canonicalFormCycle(C)
{
	// compare cycles in a canonical form by rotating to the smallest element
	// with the additional requirement that the 2nd element be smaller than the
	// last to prevent each cycle being stored twice
	var minIndex = 0;
	const k = C.length;
	for (var i = 1; i < k; ++i)
	{
		if (C[i] < C[minIndex])
		{
			minIndex = i;
		}
	}
	var canonicalForm = new Array(k);
	// now test if the next one is smaller than the previous, if not mirror
	if (C[(minIndex + 1) % k] > C[(minIndex + k - 1) % k])
	{
		for (var i = 0; i < k; ++i)
		{
			canonicalForm[(k - i) % k] = C[(minIndex + i) % k];
		}
	}
	else
	{
		for (var i = 0; i < k; ++i)
		{
			canonicalForm[i] = C[(minIndex + i) % k];
		}
	}
	return canonicalForm;
}


const EdgeType = {
	NON_EDGE : 0,
	INCLUSION : 1,
	OVERLAP : 2
};

function computeEdgeTypes(G)
{
	const n = G.list.length;
	var types = new Array(n);
	for (var i = 0; i < n; ++i)
	{
		types[i] = new Array(n);
		types[i].fill(EdgeType.NON_EDGE);
		types[i][i] = EdgeType.INCLUSION;
	}
	for (var i = 0; i < n; ++i)
	{
		for (var j = 0; j < G.list[i].length; ++j)
		{
			const x = G.list[i][j];
			if (i < x)
			{
				var u, v;
				if (G.list[i].length < G.list[x].length)
				{
					u = i;
					v = x;
				}
				else
				{
					u = x;
					v = i;
				}
				var type = EdgeType.INCLUSION;
				for (var k = 0; k < G.list[u].length; ++k)
				{
					const w = G.list[u][k];
					if (w != v && !hasEdge(G, v, w))
					{
						type = EdgeType.OVERLAP;
						break;
					}
				}
				types[u][v] = type;
				types[v][u] = type;
			}
		}
	}
	return types;
}

function removeTrueTwinsAndUniversal(G)
{
	const types = computeEdgeTypes(G);
	var H = createGraph(0);
	var GtoH = new Array(G.list.length);
	// remove true twins/universal vertices from G to make H (vertices only)
	// and create a mapping GtoH that is -1 if the vertex was removed
	// (this is the same for true twins mapping it to the kept twin
	// as adding in such an edge would happen anyway from the kept twin)
	for (var u = 0; u < G.list.length; ++u)
	{
		// universal?
		if (G.list[u].length >= G.list.length - 1)
		{
			GtoH[u] = -1;
			continue;
		}
		var smallestTwin = u;
		for (var i = 0; i < G.list[u].length; ++i)
		{
			// true twin?
			const v = G.list[u][i];
			if (types[u][v] == EdgeType.INCLUSION &&
			    G.list[u].length == G.list[v].length &&
			    v < smallestTwin)
			{
				smallestTwin = v;
			}
		}
		// keep only the smallest (by index) vertex among its twins
		if (u != smallestTwin)
		{
			GtoH[u] = -1;
			continue;
		}
		// we are not a true twin or universal vertex!
		GtoH[u] = addVertex(H);
		H.pos[GtoH[u]].x = G.pos[u].x;
		H.pos[GtoH[u]].y = G.pos[u].y;
	}
	// now add the edges into H corresponding to G
	for (var uG = 0; uG < G.list.length; ++uG)
	{
		const uH = GtoH[uG];
		if (uH != -1)
		{
			for (var i = 0; i < G.list[uG].length; ++i)
			{
				const vG = G.list[uG][i];
				const vH = GtoH[vG];
				if (vH != -1)
				{
					addEdge(H, uH, vH);
				}
			}
		}
	}
	return H;
}

// prev[u] shall be defined to u's BFS parent, or -1 if u is the root
// finds a u->v walk through the BFS tree as a return
function recoverPathFromBFSTree(prev, u, v)
{
	// mark all visited vertices in the u->root walk
	// then walk up the v->root walk until we hit a visited verted in the u->root
	// walk to determine the first common ancester, so that our cycle is an odd cycle
	// and not just an odd walk
	var urVisited = new Array(prev.length);
	urVisited.fill(false);
	var i = u;
	var path = [];
	while (i != -1)
	{
		urVisited[i] = true;
		path.push(i);
		i = prev[i];
	}
	i = v;
	var vrPath = [v];
	var k = path.length;
	while (!urVisited[i])
	{
		vrPath.push(prev[i]);
		i = prev[i];
		--k;
	}
	path.pop(k);
	path = path.concat(vrPath.reverse());
	return path;
}

// assumes x-y is an edge
function avoidsVertex(types, z, x, y)
{
	// xy avoids z if xz, yz not inclusion and if xz, yz
	// both overlap, then xy inclusion
	//assert(types[x][y] != EdgeType.NON_EDGE);
	const zOverlapsXY = types[z][x] == EdgeType.OVERLAP &&
						types[z][y] == EdgeType.OVERLAP;
	const noInclusion = types[z][x] != EdgeType.INCLUSION &&
						types[z][y] != EdgeType.INCLUSION;
	return noInclusion && (types[x][y] == EdgeType.INCLUSION || !zOverlapsXY)
}
function avoidsEdge(types, x_1, x_2, y_1, y_2)
{
	return avoidsVertex(types, x_1, y_1, y_2) &&
		   avoidsVertex(types, x_2, y_1, y_2) &&
		   avoidsVertex(types, y_1, x_1, x_2) &&
		   avoidsVertex(types, y_2, x_1, x_2);
}

// return: [G's circlar completion, types, z, P = [x1, ..., xk], Q = [y1, ..., yk]]
function findAnchoredInvertiblePair(G)
{
	const completion = circularComplete(removeTrueTwinsAndUniversal(G));
	const H = completion[0];
	const pairs = completion[1];
	const types = computeEdgeTypes(H);
	const n = H.list.length;
	
	// find z of min degree
	var z = 0;
	for (var i = 1; i < n; ++i)
	{
		if (H.list[i].length < H.list[z].length)
		{
			z = i;
		}
	}
	
	// search uz-components
	var gamma = new Array(n); // gamma[u][v] looks up which uz-component v is in
	var uzBFSPar = new Array(n); // uzBFSPar[u][v] looks up v's parent in the BFS-tree of Xuz
	for (var i = 0; i < n; ++i)
	{
		gamma[i] = new Array(n);
		//gamma[i].fill(-1);
		uzBFSPar[i] = new Array(n);
		//uzBFSPar[i].fill(-1);
	}
	var uzComps = new Array(n); // uzComps[u] = uz-components
	var uzCompOffset = new Array(n); // uzCompOffset[u] == u_1 and u_j = u_1 + j
	//uzCompOffset.fill(-1);
	//uzComps.fill(0);
	var uzCompTotal = 0;
	var potato = [];// potato[x] for x in V(K) is y (in H) if it was created from the yz-components
	for (var u = 0; u < n; ++u) // u in H
	{
		if (types[u][z] != EdgeType.INCLUSION)
		{
			var HtoXuz = new Array(n);
			HtoXuz.fill(-1);
			var XuztoH = [];
			var Xuz = createGraph(0);
			for (var x = 0; x < n; ++x) // x in H
			{
				if (types[u][x] != EdgeType.INCLUSION && types[z][x] != EdgeType.INCLUSION)
				{
					HtoXuz[x] = addVertex(Xuz);
					XuztoH.push(x);
				}
			}
			// to find uz-components we can just look at H[A(z) int A(u)]
			// then remove inclusion edges - since all vertices in this induced
			// subgraph overlap or are on-adjacent, then if we remove all overlap
			// edges where both endpoints overlap z or u, we are fine and can follow it
			for (var x = 0; x < H.list.length; ++ x) // x in H
			{
				const xU = HtoXuz[x];
				if (xU != -1) // x in Xuz?
				{
					for (var i = 0; i < H.list[x].length; ++i)
					{
						const y = H.list[x][i]; // y in H
						const yU = HtoXuz[y];
						if (yU != -1) // y in Xuz?
						{
							if (avoidsVertex(types, z, x, y) && avoidsVertex(types, u, x, y))
							{
								addEdge(Xuz, xU, yU);
							}
						}
					}
				}
			}
			const uzComponents = bfsComponents(Xuz, wholeEdge);
			uzComps[u] = bfsComponents(Xuz, wholeEdge);
			uzCompOffset[u] = uzCompTotal;
			uzCompTotal += uzComps[u].length;
			for (var i = 0; i < uzComps[u].length; ++i)
			{
				potato.push(u);
				for (var j = 0; j < uzComps[u][i].length; ++j) 
				{
					const x = uzComps[u][i][j][1]; // x in Xuz
					const xH = XuztoH[x];
					gamma[u][xH] = i;
					const prev = uzComps[u][i][j][0]; // prev in Xuz
					uzBFSPar[u][xH] = prev == -1 ? -1 : XuztoH[prev];
				}
			}
		}
	}
	
	// construct knotting graph
	var K = createGraph(uzCompTotal);
	for (var u = 0; u < n; ++u) // u in H
	{
		if (types[u][z] != EdgeType.INCLUSION)
		{
			for (var v = u + 1; v < n; ++v)
			{
				// u, v in A(z), uv non-edge or overlap
				if (types[v][z] != EdgeType.INCLUSION && types[u][v] != EdgeType.INCLUSION)
				{
					const ui = uzCompOffset[u] + gamma[u][v];
					const vj = uzCompOffset[v] + gamma[v][u];
					addEdge(K, ui, vj);
				}
			}
		}
	}
	
	// find odd-cycle in K
	var oddCycle = [];
	for (var root = 0; root < K.list.length && oddCycle.length == 0; ++root)
	{
		var queue = new CircularQueue(K.list.length);
		var visited = new Array(K.list.length);
		visited.fill(false);
		var prev = new Array(K.list.length);
		var col = new Array(K.list.length);
		function visit(u, v)
		{
			queue.push(v);
			visited[v] = true;
			prev[v] = u;
			col[v] = u == -1 || col[u] == 1 ? 0 : 1; // greedy 2-colour it
		}
		visit(-1, root);
		while (queue.length() > 0 && oddCycle.length == 0)
		{
			const u = queue.pop();
			for (var i = 0; i < K.list[u].length; ++i)
			{
				const v = K.list[u][i];
				if (visited[v])
				{
					if (col[u] == col[v]) // odd cycle
					{
						oddCycle = recoverPathFromBFSTree(prev, u, v);
						break;
					}
				}
				else
				{
					visit(u, v);
				}
			}
		}
	}
	
	// reconstruct paths
	var P = [];
	var Q = [];
	for (var i = 0; i < oddCycle.length; ++i)// uzBFSPar[u][v] looks up v's parent in the BFS-tree of Xuz
	{
		const v = potato[oddCycle[(i - 1 + oddCycle.length) % oddCycle.length]];
		const ui = potato[oddCycle[i]];
		const w = potato[oddCycle[(i + 1) % oddCycle.length]];
		const Pi = recoverPathFromBFSTree(uzBFSPar[ui], v, w);
		var uiPath = new Array(Pi.length);
		uiPath.fill(ui);
		if (i % 2 == 0)
		{
			P = P.concat(Pi);
			Q = Q.concat(uiPath);
		}
		else
		{
			P = P.concat(uiPath);
			Q = Q.concat(Pi);
		}
	}

	return [H, types, z, P, Q, K, oddCycle];
}

function findAnchoredInvertiblePairAlt(G)
{
	const completion = circularComplete(removeTrueTwinsAndUniversal(G));
	const H = completion[0];
	const pairs = completion[1];
	const types = computeEdgeTypes(H);
	const n = H.list.length;
	
	// find z of min degree
	var z = 0;
	for (var i = 1; i < n; ++i)
	{
		if (H.list[i].length < H.list[z].length)
		{
			z = i;
		}
	}
	
	var K = createGraph(0);
	var KtoH = []; // KtoH[x] = [u, v] is x is the (u, v)
	var HtoK = new Array(n);
	var cpair = new Array(n);
	for (var i = 0; i < pairs.length; ++i)
	{
		const ui = pairs[i][0];
		const uibar = pairs[i][1];
		cpair[ui] = uibar;
		cpair[uibar] = ui;
	}
	// does this work?
	function vname(x)
	{
		if (x < n / 2)
			return String.fromCharCode(65 + x);
		else
			return String.fromCharCode(97 + (x - (n/2)));
	}
	for (var i = 0; i < n; ++i)
	{
		HtoK[i] = new Array(n);
		//HtoK[i].fill(-1);
	}
	for (var u = 0; u < n; ++u) // u in H
	{
		if (types[u][z] != EdgeType.INCLUSION)
		{
			for (var v = 0; v < n; ++v)
			{
				if (types[v][z] != EdgeType.INCLUSION && types[u][v] != EdgeType.INCLUSION)
				{
					HtoK[u][v] = addVertex(K);
					KtoH.push([u, v]);
					//console.log("added vertex (" + vname(u) + "," + vname(v) + " );  ");
				}
			}
		}
	}
	const nK = K.list.length;
	// add edges into delta-implication class graph
	function linkPair(x_1, y_1, x_2, y_2)
	{
		if (avoidsVertex(types, z, x_1, x_2) && avoidsVertex(types, z, y_1, y_2)
			&& avoidsEdge(types, x_1, x_2, y_1, y_2))
		{
			//if (!hasEdge(K, HtoK[x_1][y_1], HtoK[x_2][y_2]))
				//console.log("joined (" + vname(x_1) + ", " + vname(y_1) + ") to (" + vname(x_2) + ", " + vname(y_2) + ")");
			addEdge(K, HtoK[x_1][y_1], HtoK[x_2][y_2]);
		}
	}
	for (var uv = 0; uv < nK; ++uv) // uv in K
	{
		const u = KtoH[uv][0]; // u in H
		const v = KtoH[uv][1]; // v in H
		for (var i = 0; i < H.list[u].length; ++i)
		{
			const x = H.list[u][i];
			linkPair(u, v, x, v);
			for (var j = 0; j < H.list[v].length; ++j)
			{
				const y = H.list[v][j];
				linkPair(u, v, u, y);
				linkPair(u, v, x, y);
			}
		}
	}
	var implicationClass = new Array(nK); // implicationClass[x] looks up which implication class x = (u,v) is in. We refer to the root of the BFS of each as the class id
	implicationClass.fill(-1);
	var prev = new Array(K.list.length);
	var shortestImplPath = [];
	for (var root = 0; root < nK && shortestImplPath.length == 0; ++root)
	{
		if (implicationClass[root] == -1)
		{
			var queue = new CircularQueue(nK);
			function visit(y, x)
			{
				queue.push(x);
				implicationClass[x] = root;
				prev[x] = y;
				const u = KtoH[x][0]; // u in H
				const v = KtoH[x][1]; // v in H
				const vu = HtoK[v][u];
				if (implicationClass[vu] == root) // path between them
				{
					const implPath = recoverPathFromBFSTree(prev, x, vu);
					if (shortestImplPath.length == 0 || implPath.length < shortestImplPath.length)
					{
						shortestImplPath = implPath;
					}
				}
			}
			visit(-1, root);
			while (queue.length() > 0 && shortestImplPath.length == 0)
			{
				const x = queue.pop();
				for (var i = 0; i < K.list[x].length; ++i)
				{
					const y = K.list[x][i];
					if (implicationClass[y] == -1)
					{
						visit(x, y);
					}
				}
			}
		}
	}
	var P = [];
	var Q = [];
	for (var i = 0; i < shortestImplPath.length; ++i)
	{
		P.push(KtoH[shortestImplPath[i]][0]);
		Q.push(KtoH[shortestImplPath[i]][1]);
	}
	return [H, types, z, P, Q, K];
}
