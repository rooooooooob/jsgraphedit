"use strict";

function complement(G)
{
	var H = cloneGraph(G);
	const n = H.matrix.length;
	for (var i = 0; i < n; ++i)
	{
		for (var j = 0; j < n; ++j)
		{
			if (H.matrix[i][j] == -1)
			{
				H.matrix[i][j] = 1;
			}
			else
			{
				H.matrix[i][j] = -1;
			}
		}
	}
	setListFromMatrix(H);
	return H;
}

function generateConnected(settings)
{
	// create a spanning tree
	var G = generateTree(settings);
	// add more edges randomly
	const n = settings.n;
	// place a uniformly at random amount of vertices between 0 and n choose 2
	// but place at least n - 1 for a spanning tree to ensure connectivity
	const m = Math.floor(Math.random() * n * (n - 1) / 2);
	for (var i = n - 1; i < m; ++i)
	{
		placeRandomEdge(G);
	}
	return G;
}

function generateTree(settings)
{
	if (settings.n < 3)
	{
		return generateComplete(settings);
	}
	// generate a Prufer sequence then construct a tree from it
	var seq = []
	for (var i = 0; i < settings.n - 2; ++i)
	{
		seq.push(Math.floor(Math.random() * settings.n));
	}
	return fromPrufer(seq);
}

function fromPrufer(seq)
{
	var G = createGraph(seq.length + 2);
	var s = seq.slice().reverse();
	var l = new Array(G.list.length);
	for (var i = 0; i < l.length; ++i)
	{
		l[i] = i;
	}
	function less(a, b)
	{
		return a - b;
	}
	for (var i = 0; i < seq.length; ++i)
	{
		l.sort(less);
		for (var j = 0; j < l.length; ++j)
		{
			if (s.lastIndexOf(l[j]) == -1)
			{
				addEdge(G, s[s.length - 1], l[j]);
				s.pop();
				l[j] = l[l.length - 1];
				l.pop();
				l.sort();
				break;
			}
		}
	}
	addEdge(G, l[0], l[1]);
	return G;
}

function toPrufer(G)
{
	var seq = [];
	
	var remaining = new Array(G.list.length);
	var degrees = new Array(G.list.length);
	for (var i = 0; i < remaining.length; ++i)
	{
		remaining[i] = i;
		degrees[i] = G.list[i].length;
	}
	var minleaf;
	
	for (var i = 0; i < G.list.length - 2; ++i)
	{
		minleaf = -1;
		for (var j = 0; j < remaining.length - i; ++j)
		{
			if ((minleaf == -1 || remaining[j] < remaining[minleaf]) && degrees[remaining[j]] == 1)
			{
				minleaf = j;
			}
		}
		var stem = -1;
		const neighbors = G.list[remaining[minleaf]];
		for (var j = 0; stem == -1 && j < neighbors.length; ++j)
		{
			for (var k = 0; stem == -1 && k < remaining.length - i; ++k)
			{
				if (remaining[k] == neighbors[j])
				{
					stem = neighbors[j];
				}
			}
		}
		seq.push(stem);
		--degrees[stem];
		remaining[minleaf] = remaining[remaining.length - 1 - i];
	}
	
	return seq;
}

function generateComplete(settings)
{
	var G = createGraph(settings.n);
	for (var i = 0; i < settings.n; ++i)
	{
		for (var j = 0; j < settings.n; ++j)
		{
			if (i != j)
			{
				addArc(G, i, j);
			}
		}
	}
	return G;
}

function placeRandomEdge(G)
{
	if (G.list.length > 1)
	{
		var u;
		var v;
		do
		{
			u = Math.floor(Math.random() * G.list.length);
			v = Math.floor(Math.random() * G.list.length);
		}
		while (u == v || G.list[u].indexOf(v) != -1 || G.list[v].indexOf(u) != -1)
		addEdge(G, u, v);
	}
}

function placeRandomEdgeBetween(G, U, V)
{
	if (G.list.length > 1)
	{
		var u;
		var v;
		do
		{
			u = U[Math.floor(Math.random() * U.length)];
			v = V[Math.floor(Math.random() * V.length)];
		}
		while (G.list[u].indexOf(v) != -1 || G.list[v].indexOf(u) != -1)
		addEdge(G, u, v);
	}
}

function generateHamiltonian(settings)
{
	const n = settings.n;
	var G = createGraph(n);
	// make a random hamiltonian cycle
	var perm = randomPermutation(n);
	for (var i = 0; i < n; ++i)
	{
		addEdge(G, perm[i], perm[(i + 1) % n]);
	}
	// then add random edges
	const m = Math.floor(Math.random() * n * (n - 1) / 2);
	for (var i = n - 1; i < m; ++i)
	{
		placeRandomEdge(G);
	}
	return G;
}

function generatePermutationGraph(settings)
{
	const n = settings.n;
	var G = createGraph(n);
	// a permutation graph has (v_i, v_j) in E(G) iff i < j and p^1(i) > p^(j)
	// for some permutation p (perm here represents p^1 since there's no reason to
	// compute p^-1 since we only use p^-1 so just assume that p^-1 = perm and perm^-1 = p
	const perm = randomPermutation(n);
	for (var j = 1; j < n; ++j)
	{
		for (var i = 0; i < j; ++i)
		{
			if (perm[i] > perm[j])
			{
				addEdge(G, i, j);
			}
		}
	}
	return G;
}

function generateSplit(settings)
{
	var G = createGraph(settings.n);
	const cliqueSize = 1 + Math.floor(Math.random() * (settings.n - 2));
	const indepSize = settings.n - cliqueSize;
	// to figure out which ones should be in the indep set, just take the first cliqueSize of this
	const perm = randomPermutation(settings.n);
	var U = [];
	var V = [];
	for (var i = 0; i < cliqueSize; ++i)
	{
		U.push(perm[i]);
	}
	for (var i = 0; i < indepSize; ++i)
	{
		V.push(perm[i + cliqueSize]);
	}
	const crossEdges = Math.floor(Math.random() * (indepSize * cliqueSize));
	for (var i = 0; i < crossEdges; ++i)
	{
		placeRandomEdgeBetween(G, U, V);
	}
	// now add edges between vertices of the clique
	for (var i = 1; i < cliqueSize; ++i)
	{
		for (var j = 0; j < i; ++j)
		{
			addEdge(G, perm[i], perm[j]);
		}
	}
	return G;
}

function randomPermutation(n)
{
	var output = new Array(n);
	for (var i = 0; i < n; ++i)
	{
		output[i] = i;
	}
	for (var i = n - 1; i > 0; --i)
	{
		var j = Math.floor(Math.random() * (i + 1));
		var tmp = output[i];
		output[i] = output[j];
		output[j] = tmp;
	}
	return output;
}


function generateChordal(settings)
{
	// this algorithm works by starting with K_1 and slowly building up the graph by adding
	// in simplicial vertices to existing cliques in the graph
	// this works well since there are a linear amount of maximal cliques in a chordal graph
	// and we can just pick one of these at random and then pick a subset of these at random
	// to effectively find a clique in G to attach the simplicial vertex to in linear time
	if (settings.n > 31)
	{
		alert("Doesn't work for n > 31 right now - setting n = 31. I will make it work on bigger n later.");
		settings.n = 31;
	}
	const n = settings.n;
	var G = createGraph(n);
	// this is not the actual max cliques, but the max cliques at time of adding
	// this is okay because any time a simplicial vertex is added, the max clique
	// it forms will be counted for it, so we don't need to think about it for every
	// other vertex. maxCliqueSize however keeps track of the max clique a vertex
	// is in, so that we know maxCliques[v] is only valid if maxCliques[v].length
	// is the same as maxCliqueSize[v]
	var maxCliques = [[0]];
	var maxCliqueSize = new Array(n);
	// every vertex v has {v} as a clique
	maxCliqueSize.fill(1);
	for (var u = 1; u < n; ++u)
	{
		var uniqueMaxCliques = {};
		for (var i = 0; i < u; ++i)
		{
			// as explained in the above comment, maxCliques[v] is only valid if
			// maxCliqueSize[v] == maxCliques[v].length
			if (maxCliqueSize[i] == maxCliques[i].length)
			{
				uniqueMaxCliques[maxCliques[i].toString()] = maxCliques[i];
			}
		}
		var totalCliques = 0;
		for (var maximalClique in uniqueMaxCliques)
		{
			// this is not good since even between 2 unique maximal cliques
			// ie {0, 1, 2} and {1, 2, 3, 4} the sub-clique {1, 2} is repeated twice
			// but whatever, it's good enough I guess...
			const k = uniqueMaxCliques[maximalClique].length;
			totalCliques += (1 << k) - 1;
		}
		// pick a clique at random (the + 1 is so we are in the range [0, totalCliques]
		// since we use this value later as a bitset and 0 would mean no vertices chosen
		var clique = Math.floor(Math.random() * totalCliques) + 1;
		// @todo make this work with over 32 
		var simplicialNeighbors = [];
		for (var maximalClique in uniqueMaxCliques)
		{
			// there are 2^n subsets of size n, so there are 2^n - 1
			// non-empty cliques of an n-clique, which is (1 << n )- 1
			const chosenCliqueGroup = uniqueMaxCliques[maximalClique];
			const subCliques = (1 <<chosenCliqueGroup.length) - 1;
			if (clique < 0)
			{
				break;
			}
			if (clique <= subCliques)
			{
				for (var i = 0; i < n; ++i)
				{
					if (clique & (1 << i))
					{
						simplicialNeighbors.push(chosenCliqueGroup[i]);
					}
				}
			}
			clique -= subCliques;
		}
		maxCliques.push([u]);
		maxCliqueSize[u] = simplicialNeighbors.length + 1;
		for (var i = 0; i < simplicialNeighbors.length; ++i)
		{
			const v = simplicialNeighbors[i];
			addEdge(G, u, v);
			maxCliques[u].push(v);
			// update v's knowledge of the size of it's maximal clique if
			// N[u] is bigger than its previous maximal clique only
			maxCliqueSize[v] = Math.max(maxCliqueSize[v], maxCliqueSize[u]);
		}
		// so that we can have a canonical form for each clique so we don't consider duplicates
		maxCliques[u].sort();
	}
	return G;
}
