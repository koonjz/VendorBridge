require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // --- Users & Vendors ---
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@vendorbridge.com',
      role: 'Admin',
      password: passwordHash
    }
  });

  const officer = await prisma.user.create({
    data: {
      name: 'Procurement Officer 1',
      email: 'officer@vendorbridge.com',
      role: 'Procurement Officer',
      password: passwordHash
    }
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Manager Approver',
      email: 'manager@vendorbridge.com',
      role: 'Manager',
      password: passwordHash
    }
  });

  // Vendors
  const vendorA = await prisma.vendor.create({
    data: {
      companyName: 'Global Supplies Inc',
      contactPerson: 'Alice Smith',
      email: 'contact@vendora.com',
      phone: '123-456-7890',
      category: 'Hardware',
      status: 'Active',
      gst: 'GST123456789',
      address: '123 Tech Lane',
      country: 'USA',
      notes: 'Preferred partner',
      rating: 4.5,
      user: {
        create: {
          name: 'Vendor A',
          email: 'contact@vendora.com',
          role: 'Vendor',
          password: passwordHash
        }
      }
    }
  });

  const vendorB = await prisma.vendor.create({
    data: {
      companyName: 'Office Essentials Ltd',
      contactPerson: 'Bob Jones',
      email: 'contact@vendorb.com',
      phone: '098-765-4321',
      category: 'Stationery',
      status: 'Pending',
      gst: 'GST987654321',
      address: '456 Paper St',
      country: 'UK',
      notes: 'New vendor',
      rating: 0,
      user: {
        create: {
          name: 'Vendor B',
          email: 'contact@vendorb.com',
          role: 'Vendor',
          password: passwordHash
        }
      }
    }
  });

  // --- RFQs ---
  const rfq1 = await prisma.rfq.create({
    data: {
      title: 'Office Furniture 2026',
      description: 'Procurement of ergonomic chairs and motorized standing desks for the new downtown office.',
      category: 'Furniture',
      quantity: 70,
      unit: 'Pieces',
      budget: 15000,
      priority: 'High',
      deadline: new Date(Date.now() + 86400000 * 14),
      status: 'Open',
      createdBy: officer.id,
      notes: 'Needs to be delivered by Q3.',
      assignedVendors: {
        connect: [{ id: vendorA.id }, { id: vendorB.id }]
      }
    }
  });

  // --- Quotations ---
  const quote1 = await prisma.quotation.create({
    data: {
      rfqId: rfq1.id,
      vendorId: vendorA.id,
      price: 14500,
      currency: 'USD',
      tax: 500,
      discount: 200,
      finalAmount: 14800,
      deliveryDays: 14,
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 20),
      warranty: '2 Years',
      paymentTerms: 'Net 30',
      status: 'Submitted',
      notes: 'Price includes full assembly.'
    }
  });

  // --- Activity Logs ---
  await prisma.activityLog.create({
    data: {
      userId: officer.id,
      role: 'Procurement Officer',
      module: 'RFQs',
      action: 'RFQ Created',
      details: 'Office Furniture 2026 created',
      status: 'success',
      ipAddress: '192.168.1.45'
    }
  });

  // --- Notifications ---
  await prisma.notification.create({
    data: {
      userId: 'all',
      type: 'RFQ',
      title: 'New RFQ Assigned',
      description: `You have been assigned to ${rfq1.title}`,
      status: 'unread'
    }
  });

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
