"use strict";

function generateConnected(settings)
{
	// create a spanning tree
	var vertices = generateTree(settings);
	// add more edges randomly
	const n = settings.n;
	// place a uniformly at random amount of vertices between 0 and n choose 2
	// but place at least n - 1 for a spanning tree to ensure connectivity
	const m = Math.floor(Math.random() * n * (n - 1) / 2);
	for (var i = n - 1; i < m; ++i)
	{
		placeRandomEdge(vertices);
	}
	return vertices;
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
	var vertices = generateNull(seq.length + 2);
	var s = seq.slice().reverse();
	var l = new Array(vertices.length);
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
				addEdge(vertices, s[s.length - 1], l[j]);
				s.pop();
				l[j] = l[l.length - 1];
				l.pop();
				l.sort();
				break;
			}
		}
	}
	addEdge(vertices, l[0], l[1]);
	return vertices;
}

function toPrufer(vertices)
{
	var seq = [];
	
	var remaining = new Array(vertices.length);
	var degrees = new Array(vertices.length);
	for (var i = 0; i < remaining.length; ++i)
	{
		remaining[i] = i;
		degrees[i] = vertices[i].edges.length;
	}
	var minleaf;
	
	for (var i = 0; i < vertices.length - 2; ++i)
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
		const neighbors = vertices[remaining[minleaf]].edges;
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
	var vertices = generateNull(settings.n);
	for (var i = 0; i < settings.n; ++i)
	{
		for (var j = 0; j < settings.n; ++j)
		{
			if (i != j)
			{
				addArc(vertices, i, j);
			}
		}
	}
	return vertices;
}

function generateNull(n)
{
	var vertices = []
	for (var i = 0; i < n; ++i)
	{
		addVertex(vertices);
	}
	return vertices;
}

function placeRandomEdge(vertices)
{
	if (vertices.length > 1)
	{
		var u;
		var v;
		do
		{
			u = Math.floor(Math.random() * vertices.length);
			v = Math.floor(Math.random() * vertices.length);
		}
		while (u == v || vertices[u].edges.indexOf(v) != -1 || vertices[v].edges.indexOf(u) != -1 )
		addEdge(vertices, u, v);
	}
}

function generateHamiltonian(settings)
{
	const n = settings.n;
	var vertices = generateNull(n);
	// make a random hamiltonian cycle
	var perm = randomPermutation(n);
	for (var i = 0; i < n; ++i)
	{
		addEdge(vertices, perm[i], perm[(i + 1) % n]);
	}
	// then add random edges
	const m = Math.floor(Math.random() * n * (n - 1) / 2);
	for (var i = n - 1; i < m; ++i)
	{
		placeRandomEdge(vertices);
	}
	return vertices;
}

function generatePermutationGraph(settings)
{
	const n = settings.n;
	var vertices = generateNull(n);
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
				addEdge(vertices, i, j);
			}
		}
	}
	return vertices;
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
