import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";


interface IRewarder {
    using SafeERC20 for IERC20;

    function onRubyReward(address user, uint256 newLpAmount) external;

    function pendingTokens(address user) external view returns (uint256 pending);

    function rewardToken() external view returns (address);
}