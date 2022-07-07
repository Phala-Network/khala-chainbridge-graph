import { bridge as Bridge, Deposit, ProposalEvent, ProposalVote } from '../generated/bridge/bridge'
import { erc20AssetHandler as Erc20AssetHandler, Deposited, Withdrawn} from '../generated/bridge/erc20AssetHandler'
import { Tx, CTxSent, CTxReceived, ERC20Deposited, ERC20Withdrawn} from '../generated/schema'

enum ProposalStatus {
    Inactive,
    Active,
    Passed,
    Executed,
    Cancelled
}

export function handleDeposit(event: Deposit): void {
    // get deposit info
    let record = new CTxSent(event.params.destinationChainID.toString() + '-' + event.params.depositNonce.toString())
    record.createdAt = event.block.timestamp
    record.destChainId = event.params.destinationChainID
    record.depositNonce = event.params.depositNonce
    record.resourceId = event.params.resourceID.toHexString()

    // get meta data from erc20handler storage
    let bridge = Bridge.bind(event.address)
    let handlerAddress = bridge._resourceIDToHandlerAddress(event.params.resourceID)
    let handler = Erc20AssetHandler.bind(handlerAddress)
    let handlerRecord = handler.getDepositRecord(event.params.depositNonce, event.params.destinationChainID)
    record.amount = handlerRecord._amount
    record.recipient = handlerRecord._destinationRecipientAddress.toHexString()
    record.sender = handlerRecord._depositer.toHexString()

    // get transaction data, sendTx maybe created within ERC20Withdrawn handler according to the sequence
    let sendTx = Tx.load(event.transaction.hash.toHexString());
    if (sendTx == null) {
        sendTx = new Tx(event.transaction.hash.toHexString())
        sendTx.hash = event.transaction.hash.toHexString()
        sendTx.sender = event.transaction.from.toHexString()
        sendTx.save()
    }
    record.sendTx = sendTx.id;

    record.save()
}

function createRecordByProposalEvent(event: ProposalEvent): void {
    let depositNonce = event.params.depositNonce
    let originChainId = event.params.originChainID
    let resourceId = event.params.resourceID

    let record = new CTxReceived(originChainId.toString() + '-' + depositNonce.toString())
    record.createdAt = event.block.timestamp

    record.originChainId = originChainId
    record.depositNonce = depositNonce
    record.resourceId = resourceId.toHexString()

    record.status = 'Inactive'
    record.save()
}

function createRecordByProposalVote(event: ProposalVote): void {
    let depositNonce = event.params.depositNonce
    let originChainId = event.params.originChainID
    let resourceId = event.params.resourceID

    let record = new CTxReceived(originChainId.toString() + '-' + depositNonce.toString())
    record.createdAt = event.block.timestamp

    record.originChainId = originChainId
    record.depositNonce = depositNonce
    record.resourceId = resourceId.toHexString()

    record.status = event.params.status.toString()

    let voteTx = new Tx(event.transaction.hash.toHexString())
    voteTx.hash = event.transaction.hash.toHexString()
    voteTx.sender = event.transaction.from.toHexString()
    voteTx.save()

    let votes = record.voteTxs;
    votes.push(voteTx.id.toString())
    record.voteTxs = votes

    record.save()
}

export function handleProposalEvent(event: ProposalEvent): void {
    let depositNonce = event.params.depositNonce
    let originChainId = event.params.originChainID

    if (event.params.status === ProposalStatus.Active) {
        let record = CTxReceived.load(originChainId.toString() + '-' + depositNonce.toString());
        if (record == null) {
            // proposal just being created
            createRecordByProposalEvent(event)
        } else {
            // if proposal hasn't arrive the threshold, proposal would keep active
            record.status = 'Active'
            record.save()
        }
    }

    if (event.params.status === ProposalStatus.Passed) {
        let record = CTxReceived.load(originChainId.toString() + '-' + depositNonce.toString());
        if (record == null) {
            // shouldn't be here, but we still create a new one
            createRecordByProposalEvent(event)
        } else {
            record.status = 'Passed'
            record.save()
        }
    }

    if (event.params.status === ProposalStatus.Executed) {
        let record = CTxReceived.load(originChainId.toString() + '-' + depositNonce.toString());
        if (record !== null) {
            // with this vote transaction, proposal arrived threshold
            // get transaction data, sendTx maybe created within ERC20Deposited handler according to the sequence
            let executeTx = Tx.load(event.transaction.hash.toHexString());
            if (executeTx == null) {
                executeTx = new Tx(event.transaction.hash.toHexString())
                executeTx.hash = event.transaction.hash.toHexString()
                executeTx.sender = event.transaction.from.toHexString()
                executeTx.save()
            }

            record.executeTx = executeTx.id.toString()
            record.status = 'Executed'
            record.save()
        }
    }

    if (event.params.status === ProposalStatus.Cancelled) {
        let record = CTxReceived.load(originChainId.toString() + '-' + depositNonce.toString());
        if (record == null) {
            // shouldn't be here, but we still create a new one
            createRecordByProposalEvent(event)
        } else {
            record.status = 'Cancelled'
            record.save()
        }
    }
}

export function handleProposalVote(event: ProposalVote): void {
    let depositNonce = event.params.depositNonce
    let originChainId = event.params.originChainID

    let record = CTxReceived.load(originChainId.toString() + '-' + depositNonce.toString());
    if (record == null) {
        // proposal just being created
        createRecordByProposalVote(event)
    } else {
        // save the new vote tx
        let voteTx = new Tx(event.transaction.hash.toHexString())
        voteTx.hash = event.transaction.hash.toHexString()
        voteTx.sender = event.transaction.from.toHexString()
        voteTx.save()

        let votes = record.voteTxs;
        votes.push(voteTx.id.toString())
        record.voteTxs = votes

        record.save()
    }
}

export function handleERC20Deposited(event: Deposited): void {
    let token = event.params.token
    let recipient = event.params.recipient
    let amount = event.params.amount

    let record = new ERC20Deposited(recipient.toHexString() + '-' + event.transaction.hash.toHexString())
    record.createdAt = event.block.timestamp

    record.token = token.toHexString()
    record.recipient = recipient.toHexString()
    record.amount = amount

    // get transaction data, tx maybe created within CTxReceived handler according to the sequence
    let tx = Tx.load(event.transaction.hash.toHexString());
    if (tx == null) {
        tx = new Tx(event.transaction.hash.toHexString())
        tx.hash = event.transaction.hash.toHexString()
        tx.sender = event.transaction.from.toHexString()
        tx.save()
    }
    record.tx = tx.id;

    record.save()
}

export function handleERC20Withdrawn(event: Withdrawn): void {
    let token = event.params.token
    let depositer = event.params.depositer
    let amount = event.params.amount

    let record = new ERC20Withdrawn(depositer.toHexString() + '-' + event.transaction.hash.toHexString())
    record.createdAt = event.block.timestamp

    record.token = token.toHexString()
    record.depositer = depositer.toHexString()
    record.amount = amount

    // get transaction data, tx maybe created within CTxSent handler according to the sequence
    let tx = Tx.load(event.transaction.hash.toHexString());
    if (tx == null) {
        tx = new Tx(event.transaction.hash.toHexString())
        tx.hash = event.transaction.hash.toHexString()
        tx.sender = event.transaction.from.toHexString()
        tx.save()
    }
    record.tx = tx.id;

    record.save()
}