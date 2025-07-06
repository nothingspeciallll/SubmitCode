pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TokenClaim is Ownable {
    using SafeMath for uint256;

    // Struct to store pool information
    struct Pool {
        IERC20 token;
        uint256 totalPool;
        mapping(address => uint256) lastClaimTime;
    }

    // Mapping of token address to pool
    mapping(address => Pool) public pools;

    // Event declarations
    event TokenDeposited(address indexed token, address indexed depositor, uint256 amount);
    event TokenClaimed(address indexed token, address indexed user, uint256 amount);

    // Constructor to initialize owner
    constructor(address initialOwner) Ownable(initialOwner) {
    }

    // Modifier to check if token pool exists
    modifier poolExists(address _token) {
        require(address(pools[_token].token) != address(0), "Pool does not exist");
        _;
    }

    // Function to deposit tokens to create/update pool
    function depositToken(address _token, uint256 _amount) external {
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be greater than 0");

        IERC20 token = IERC20(_token);
        require(token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        // Initialize pool if it doesn't exist
        if (address(pools[_token].token) == address(0)) {
            pools[_token].token = token;
        }

        // Update pool balance
        pools[_token].totalPool = pools[_token].totalPool.add(_amount);

        emit TokenDeposited(_token, msg.sender, _amount);
    }

    // Function to claim tokens
    function claimToken(address _token) external poolExists(_token) {
        Pool storage pool = pools[_token];
        require(block.timestamp >= pool.lastClaimTime[msg.sender].add(1 days), "Can only claim once per day");
        require(pool.totalPool > 0, "Pool is empty");

        // Generate random amount (up to 1% of pool)
        uint256 maxClaim = pool.totalPool.div(100); // 1% of total pool
        uint256 randomAmount = _getRandomNumber(maxClaim);
        if (randomAmount == 0) {
            randomAmount = 1; // Ensure at least 1 wei
        }

        // Ensure claim doesn't exceed pool balance
        uint256 claimAmount = randomAmount > pool.totalPool ? pool.totalPool : randomAmount;

        // Update pool and user data
        pool.totalPool = pool.totalPool.sub(claimAmount);
        pool.lastClaimTime[msg.sender] = block.timestamp;

        // Transfer tokens to user
        require(pool.token.transfer(msg.sender, claimAmount), "Transfer failed");

        emit TokenClaimed(_token, msg.sender, claimAmount);
    }

    // Function to get pool information
    function getPoolInfo(address _token) external view returns (uint256 totalPool, address tokenAddress) {
        return (pools[_token].totalPool, address(pools[_token].token));
    }

    // Function to check when user can claim next
    function getNextClaimTime(address _token, address _user) external view poolExists(_token) returns (uint256) {
        uint256 nextClaim = pools[_token].lastClaimTime[_user].add(1 days);
        return nextClaim > block.timestamp ? nextClaim : block.timestamp;
    }

    // Internal function to generate random number
    function _getRandomNumber(uint256 _upperBound) private view returns (uint256) {
        if (_upperBound == 0) return 0;
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender
        ))) % _upperBound;
        return random;
    }

    // Emergency withdraw function for owner
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner poolExists(_token) {
        Pool storage pool = pools[_token];
        require(_amount <= pool.totalPool, "Amount exceeds pool balance");

        pool.totalPool = pool.totalPool.sub(_amount);
        require(pool.token.transfer(owner(), _amount), "Transfer failed");
    }
}