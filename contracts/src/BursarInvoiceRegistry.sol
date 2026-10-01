// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title BursarInvoiceRegistry
/// @notice Non-custodial invoice registry for AI-agent commerce on Tempo.
/// @dev Settlement is direct wallet-to-wallet via TIP-20 transferWithMemo.
///     This contract NEVER holds funds: it records invoice state and emits
///     events the Bursar SDK joins to TransferWithMemo logs for reconciliation.
///     Invoice IDs are bytes32 so they fit Tempo transfer memos verbatim.
contract BursarInvoiceRegistry {
    enum Status {
        None,
        Open,
        Paid,
        Cancelled
    }

    struct Invoice {
        bytes32 id;
        address merchant;
        address buyer;
        address token;
        uint256 amount;
        uint256 createdAt;
        uint256 paidAt;
        bytes32 paymentTxHash;
        Status status;
    }

    mapping(bytes32 => Invoice) public invoices;
    mapping(address => uint256) public merchantNonce;
    mapping(address => uint256) public merchantPaidCount;
    mapping(address => uint256) public merchantVolume;

    event InvoiceCreated(
        bytes32 indexed id,
        address indexed merchant,
        address indexed buyer,
        address token,
        uint256 amount
    );
    event InvoicePaid(bytes32 indexed id, bytes32 paymentTxHash, uint256 paidAt);
    event InvoiceCancelled(bytes32 indexed id);

    error InvoiceExists();
    error UnknownInvoice();
    error NotMerchant();
    error BadState();
    error ZeroAmount();
    error ZeroAddress();

    /// @notice Merchant opens an invoice. The returned id doubles as the
    ///         Tempo transfer memo the buyer attaches when paying.
    function createInvoice(
        address buyer,
        address token,
        uint256 amount
    ) external returns (bytes32 id) {
        if (buyer == address(0) || token == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        unchecked {
            id = keccak256(abi.encodePacked(msg.sender, buyer, token, amount, merchantNonce[msg.sender]++, block.chainid));
        }
        if (invoices[id].status != Status.None) revert InvoiceExists();
        invoices[id] = Invoice({
            id: id,
            merchant: msg.sender,
            buyer: buyer,
            token: token,
            amount: amount,
            createdAt: block.timestamp,
            paidAt: 0,
            paymentTxHash: bytes32(0),
            status: Status.Open
        });
        emit InvoiceCreated(id, msg.sender, buyer, token, amount);
    }

    /// @notice Merchant marks an invoice paid, citing the settlement tx hash.
    /// @dev The Bursar SDK verifies the cited tx actually carries this
    ///      invoice id in its TransferWithMemo log before trusting it.
    function markPaid(bytes32 id, bytes32 paymentTxHash) external {
        Invoice storage inv = invoices[id];
        if (inv.status != Status.Open) revert BadState();
        if (msg.sender != inv.merchant) revert NotMerchant();
        inv.status = Status.Paid;
        inv.paidAt = block.timestamp;
        inv.paymentTxHash = paymentTxHash;
        merchantPaidCount[msg.sender] += 1;
        merchantVolume[msg.sender] += inv.amount;
        emit InvoicePaid(id, paymentTxHash, block.timestamp);
    }

    function cancel(bytes32 id) external {
        Invoice storage inv = invoices[id];
        if (inv.status != Status.Open) revert BadState();
        if (msg.sender != inv.merchant) revert NotMerchant();
        inv.status = Status.Cancelled;
        emit InvoiceCancelled(id);
    }

    function getInvoice(bytes32 id) external view returns (Invoice memory) {
        return invoices[id];
    }
}
