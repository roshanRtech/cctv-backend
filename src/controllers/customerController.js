const prisma = require('../db');

// 1. Create New Customer
exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, address, email } = req.body;
    const customer = await prisma.customer.create({
      data: { name, phone, address, email }
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Get All Customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        jobs: true,
        invoices: true,
        amcs: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Get Detailed Customer Ledger & Statement of Account
exports.getCustomerLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = parseInt(id);

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        invoices: { orderBy: { createdAt: 'asc' } },
        amcs: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    let ledgerEntries = [];

    // Process Invoices & Payments
    customer.invoices.forEach((inv) => {
      // Debit Entry (Total Billed / Invoice)
      ledgerEntries.push({
        date: inv.createdAt,
        type: 'INVOICE',
        ref: inv.invoiceNumber,
        description: inv.description || 'CCTV & IT Solutions Billed',
        debit: Number(inv.totalAmount) || 0,
        credit: 0
      });

      // Credit Entry (Payment / Advance Received)
      if (inv.paidAmount > 0) {
        ledgerEntries.push({
          date: inv.createdAt,
          type: 'PAYMENT',
          ref: `PAY-${inv.invoiceNumber.replace('INV-', '')}`,
          description: `Payment Received (${inv.paymentMethod}) for ${inv.invoiceNumber}`,
          debit: 0,
          credit: Number(inv.paidAmount) || 0
        });
      }
    });

    // Sort all transactions chronologically
    ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate Running Balance & Metrics
    let runningBalance = 0;
    let totalBilled = 0;
    let totalPaid = 0;

    const statement = ledgerEntries.map((entry) => {
      totalBilled += entry.debit;
      totalPaid += entry.credit;
      runningBalance = runningBalance + entry.debit - entry.credit;

      return {
        ...entry,
        runningBalance
      };
    });

    // Net Balance Evaluation:
    // runningBalance > 0 => DUE (Customer owes company)
    // runningBalance < 0 => OVERPAID (Company holds customer credit/advance)
    // runningBalance === 0 => FULLY SETTLED

    const netStatus = runningBalance > 0 ? 'DUE' : (runningBalance < 0 ? 'OVERPAID' : 'SETTLED');

    res.json({
      customer,
      summary: {
        totalBilled,
        totalPaid,
        netBalance: runningBalance,
        status: netStatus,
        absoluteBalance: Math.abs(runningBalance)
      },
      statement
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};