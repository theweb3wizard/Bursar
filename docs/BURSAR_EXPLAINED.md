# Bursar, explained properly

This is the long version of the README. Same product, no shortcuts. If you finish
this page you will understand exactly what Bursar does, how money moves through it,
and what it deliberately does not do.

## The problem, with a concrete example

Imagine you run a small API that sells stock prices. Each lookup costs two cents.
Right now most of your customers are people. Soon, a growing share will be software:
AI assistants that check prices on their own, hundreds of times a day, while their
owners sleep.

Here is what your Monday looks like in that world. Your wallet received 4,000 tiny
payments over the weekend. They came from addresses you do not recognize, in amounts
like $0.02 and $0.015. Which customer bought what? Which requests were paid and
which failed halfway? What do you tell your accountant? What do you show a tax
authority?

You have three bad options. Keep a spreadsheet and go insane. Ignore it and hope
nobody asks. Or refuse machine customers entirely, which means refusing the future.

Credit cards cannot fix this. A card charges around thirty cents just to move money,
so a two cent payment loses money before it starts. Cards were built for humans
buying shirts, not software buying data by the sip.

That gap, between money that moves and books that make sense, is the entire reason
Bursar exists.

## What Bursar is

Bursar is billing for machine customers. You wrap your API once. From then on, every
time an agent pays you, three things happen automatically: an invoice is created with
a unique bill number, the payment is checked against the public blockchain record,
and your books update with a receipt you can show anyone.

Think of it the way a shop thinks about a cash register. The register does not make
the sale. It makes the sale countable. Bursar is the register. The blockchain moves
the money. Bursar makes sure every cent is invoiced, verified, and recorded.

## How a sale works, step by step

Say your weather API charges one cent per lookup. A weather-checking agent arrives.

**1. The agent asks.** It calls your endpoint the normal way, over plain HTTP.
It has no account with you. It never signed up. There is nothing to sign up with.

**2. Your API answers with a bill, not the data.** Instead of weather, the agent gets
back a payment request: the price (10,000 base units, which is $0.01), your wallet
address, and a bill number. In web terms this is an HTTP 402 response, which literally
means "payment required." The bill number is a random 32-byte ID. It carries no
meaning by itself, which becomes important later.

**3. The agent pays.** It sends one stablecoin transfer on the Tempo network to your
address, with the bill number attached as a memo. On Tempo this settles in about half
a second and costs a fraction of a cent in fees. On Tempo, fees are paid in
stablecoins, so the agent never needs a separate gas token. In fact, a buyer holding
exactly the purchase price and nothing else can still check out, because the fee can
be sponsored. We measured this live: a wallet with exactly the price paid in full,
and the fee was precisely zero.

**4. The agent retries with its receipt.** It calls your endpoint again, this time
attaching the bill number and the transaction hash of its payment.

**5. Bursar verifies, then serves.** Before releasing anything, Bursar reads the actual
transaction receipt from the chain and checks four things: the right token contract,
paid to the right merchant, the right bill number in the memo, and at least the full
price. Anything else, a wrong token, an underpayment, a made-up receipt, a receipt
belonging to somebody else's bill, gets the same answer: another 402, no data.
Only a fully verified payment unlocks the response.

**6. The books update.** The bill flips to paid in your ledger, with the receipt hash,
the block it settled in, and a direct link to the blockchain explorer. At tax time
you export the whole book as a CSV file.

The whole loop, request to receipt, takes seconds. Nobody clicked anything. Nobody
has an account anywhere.

## The parts, and what each one does

**The invoice registry (a smart contract).** This is a small program living on the
Tempo test network that records invoices: who bills whom, how much, in which token,
and whether each bill is open, paid, or cancelled. It never holds money. Funds move
directly from buyer to seller, wallet to wallet. The registry only keeps the records.
Its address is published, its source code is verified and readable by anyone, and it
is deliberately boring. Money code should be boring.

**The paywall kit (a few JavaScript files).** This is what a merchant installs. Two
lines wrap any web endpoint with the challenge-verify-serve flow described above. It
includes the receipt checker, which is the part that must never be skipped: it reads
the real transaction data and enforces every rule, including rejecting replays of
somebody else's receipt.

**The buyer tools.** A demonstration buyer that behaves exactly like any AI agent
would: plain web requests plus a wallet. There is also a zero-gas variant that pays
through Tempo's fee sponsor, proving buyers need no gas balance at all.

**The dashboard.** The merchant's books as a web page: totals collected, bills
waiting, every invoice clickable into its full receipt trail with explorer links.
It reads everything from public chain records, so there is no database to trust.
There is also a competitor view that hides who paid what, which leads to the next
section.

## Privacy, stated carefully

Tempo is a transparent network. Anyone can see that some address sent some amount to
another address at some time. Bursar does not change that and never claims to.

What Bursar protects is meaning. The bill number in each payment is random. Nothing
onchain says what was bought, which product earns what, or what strategy any buyer
is running. A competitor watching the chain sees money move. They cannot see your
menu, your best customers, or your volumes. That mapping lives only in your books.

And the other side of the same coin: when your accountant asks, one export hands
over every invoice, every receipt, every timestamp. Hidden from rivals, open to
auditors. There is a full threat model in the repo that lists exactly what is and is
not protected, including what we refuse to promise (hidden transfers, mathematical
proofs of privacy, protection against a determined analyst correlating timing).
Read that document before repeating any privacy claim about Bursar.

## How Bursar makes money

Two ways, both boring on purpose. A monthly subscription ($49 for most sellers,
$149 with budgets and dunning tools), plus half a percent of settled volume, capped
so no seller ever pays more than the card-based alternative. The chain cost of each
sale is a fraction of a cent (measured, not estimated), so the margin is real.

## What Bursar is not (read this before assuming)

Bursar is on the Tempo test network, which means every dollar in every demo is play
money with no value. Real businesses come after a mainnet deployment, which is a
documented half-day checklist plus a security review, deliberately scheduled after
the hackathon.

Bursar does not hold customer funds, does not lend, does not score credit, and does
not promise any privacy it cannot deliver. It does not run blockchains, issue
currency, or replace accountants. It does one job: when machines pay your API, the
money arrives with its paperwork attached.

## Links

Live demo, source code, contract address, and the threat model are all in the
[README](../README.md). Everything claimed on this page can be checked there.
