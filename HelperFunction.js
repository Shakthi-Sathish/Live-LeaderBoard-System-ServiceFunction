function createLeaderboard() {

    // ===== Node Definition =====
    function createNode(userId, score) {
        return {
            userId,
            score,
            left: null,
            right: null,
            height: 1,
            size: 1
        };
    }

    let root = null;
    const userScores = new Map();

    // ===== Utilities =====

    function height(node) {
        return node ? node.height : 0;
    }

    function size(node) {
        return node ? node.size : 0;
    }

    function updateMeta(node) {
        node.height = 1 + Math.max(height(node.left), height(node.right));
        node.size = 1 + size(node.left) + size(node.right);
    }

    function compare(aScore, aId, bScore, bId) {
        if (aScore !== bScore) return bScore - aScore; // higher first
        return aId.localeCompare(bId); // alphabetical
    }

    // ===== Rotations =====

    function rotateRight(y) {
        const x = y.left;
        const T2 = x.right;

        x.right = y;
        y.left = T2;

        updateMeta(y);
        updateMeta(x);

        return x;
    }

    function rotateLeft(x) {
        const y = x.right;
        const T2 = y.left;

        y.left = x;
        x.right = T2;

        updateMeta(x);
        updateMeta(y);

        return y;
    }

    function getBalance(node) {
        return height(node.left) - height(node.right);
    }

    function balance(node) {
        const b = getBalance(node);

        if (b > 1) {
            if (getBalance(node.left) < 0)
                node.left = rotateLeft(node.left);
            return rotateRight(node);
        }

        if (b < -1) {
            if (getBalance(node.right) > 0)
                node.right = rotateRight(node.right);
            return rotateLeft(node);
        }

        return node;
    }

    // ===== Insert =====

    function insert(node, userId, score) {
        if (!node) return createNode(userId, score);

        if (compare(score, userId, node.score, node.userId) < 0)
            node.left = insert(node.left, userId, score);
        else
            node.right = insert(node.right, userId, score);

        updateMeta(node);
        return balance(node);
    }

    // ===== Delete =====

    function minValueNode(node) {
        while (node.left) node = node.left;
        return node;
    }

    function deleteNode(node, userId, score) {
        if (!node) return null;

        const cmp = compare(score, userId, node.score, node.userId);

        if (cmp < 0)
            node.left = deleteNode(node.left, userId, score);
        else if (cmp > 0)
            node.right = deleteNode(node.right, userId, score);
        else {
            if (!node.left || !node.right)
                return node.left || node.right;

            const temp = minValueNode(node.right);
            node.userId = temp.userId;
            node.score = temp.score;
            node.right = deleteNode(node.right, temp.userId, temp.score);
        }

        updateMeta(node);
        return balance(node);
    }

    // ===== Rank =====

    function rank(node, userId, score) {
        if (!node) return 0;

        const cmp = compare(score, userId, node.score, node.userId);

        if (cmp < 0)
            return rank(node.left, userId, score);
        else if (cmp > 0)
            return size(node.left) + 1 + rank(node.right, userId, score);
        else
            return size(node.left) + 1;
    }

    // ===== Select k-th =====

    function select(node, k) {
        if (!node) return null;

        const leftSize = size(node.left);

        if (k <= leftSize)
            return select(node.left, k);
        else if (k === leftSize + 1)
            return node;
        else
            return select(node.right, k - leftSize - 1);
    }

    // ===== Public API =====

    function updateScore(userId, delta) {
        const oldScore = userScores.get(userId) || 0;
        let newScore = oldScore + delta;
        if (newScore < 0) newScore = 0;

        if (userScores.has(userId)) {
            root = deleteNode(root, userId, oldScore);
        }

        root = insert(root, userId, newScore);
        userScores.set(userId, newScore);
    }

    function getRank(userId) {
        if (!userScores.has(userId)) return -1;
        const score = userScores.get(userId);
        return rank(root, userId, score);
    }

    function getTopK(k) {
        const result = [];
        const total = size(root);
        for (let i = 1; i <= k && i <= total; i++) {
            const node = select(root, i);
            result.push([node.userId, node.score]);
        }
        return result;
    }

    function getPlayersInRange(start, end) {
        const result = [];
        const total = size(root);

        for (let i = start; i <= end && i <= total; i++) {
            const node = select(root, i);
            result.push([node.userId, node.score]);
        }
        return result;
    }

    return {
        updateScore,
        getRank,
        getTopK,
        getPlayersInRange
    };
}







//======================Usage Example===========================

const lb = createLeaderboard();

lb.updateScore("alice", 100);
lb.updateScore("bob", 200);
lb.updateScore("carol", 150);
lb.updateScore("alice", 80); // alice = 180

console.log(lb.getTopK(2));
// [ ['bob', 200], ['alice', 180] ]

console.log(lb.getRank("carol"));
// 3

console.log(lb.getPlayersInRange(1, 2));
// [ ['bob', 200], ['alice', 180] ]

lb.updateScore("bob", -500); // clamped to 0

console.log(lb.getRank("bob"));