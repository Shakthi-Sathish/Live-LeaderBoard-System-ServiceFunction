# Live-LeaderBoard-System-ServiceFunction

Understood. Below is a more natural, human-written version — concise, interview-ready, and structured as if you are explaining your own thinking.

---

## 1.How I Architected the Solution

I designed the leaderboard using two main data structures:

First, I used a **Hash Map** to store userId → score. This allows constant-time score lookup and update.

Second, I used a **self-balancing AVL tree** augmented with subtree sizes (Order Statistic Tree). The tree is ordered by:

* Score in descending order
* userId in ascending order (for tie-breaking)

Whenever a score update happens, I:

1. Fetch the current score from the map.
2. Clamp the value so it never goes below zero.
3. Remove the old entry from the tree.
4. Insert the updated score into the tree.
5. Update the map.

This ensures updates happen in O(log n).

For ranking:

* getRank() uses subtree sizes to calculate position in O(log n).
* getTopK() retrieves the first k ranked nodes using order-statistic selection.
* getPlayersInRange() also uses k-th element logic.

This avoids full sorting and scales efficiently to hundreds of thousands of players.

---

## 2. Redesign to Support Historical Snapshots

To support querying the leaderboard at past timestamps, I would redesign the tree as a **persistent AVL tree**.

Instead of modifying nodes directly during updates, I would use path-copying:

* Each update creates new nodes only along the modified path.
* Unchanged subtrees are reused (structural sharing).
* I store the root reference for each timestamp.

So I maintain something like:
Map<timestamp, root>

Each update still runs in O(log n), because only nodes along the update path are copied.

Queries like getRankAt() or getTopKAt() simply operate on the stored root for that timestamp, maintaining the same time complexity.

Memory increases by O(log n) per update, which is acceptable for versioned systems.

---

## 3.Reasoning Behind My Technical Decisions

The constraints drove the design.

Since sorting on every read is unacceptable, I ruled out arrays.
A heap was also not suitable because it cannot efficiently compute arbitrary ranks.

The requirement that getRank() must run in O(log n) means we need a balanced binary search tree with subtree sizes.

I chose AVL because:

* It guarantees strict O(log n) height.
* Performance is deterministic.
* It is easy to augment with subtree size metadata.

Using both a Hash Map and a tree was necessary:

* The map ensures O(1) score lookup.
* The tree maintains sorted ranking.

This combination ensures predictable performance, scalability to 500k+ users, and extensibility for advanced features like snapshotting.
