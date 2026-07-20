import { EPIMSData, Colour, Design, Size } from '../types';

const colours: Colour[] = ['Black', 'White'];
const designs: Design[] = ['Clean', 'Mebotorong', 'Neat'];
const sizes: Size[] = ['Small', 'Medium', 'Large', 'X-Large'];

function id(colour: Colour, design: Design, size: Size) {
  return `${colour.slice(0, 1)}-${design.slice(0, 3).toUpperCase()}-${size.slice(0, 1)}`;
}

// Deterministic-but-varied seed stock so the dashboard/reports look realistic on first load.
let seed = 7;
function rand(max: number) {
  seed = (seed * 9301 + 49297) % 233280;
  return Math.floor((seed / 233280) * max);
}

const inventory = colours.flatMap((colour) =>
  designs.flatMap((design) =>
    sizes.map((size) => {
      const minimumStock = 5;
      const quantityAvailable = rand(18);
      return {
        productId: id(colour, design, size),
        colour,
        design,
        size,
        quantityAvailable,
        reservedQuantity: rand(3),
        minimumStock,
        costPrice: 85,
        sellingPrice: 220,
        lastUpdated: new Date(Date.now() - rand(10) * 86400000).toISOString()
      };
    })
  )
);

export const mockData: EPIMSData = {
  inventory,
  supplierOrders: [
    {
      orderNumber: 'PO-1001',
      supplier: 'PrintCraft Apparel',
      date: new Date(Date.now() - 4 * 86400000).toISOString(),
      colour: 'Black',
      design: 'Mebotorong',
      size: 'Large',
      quantity: 8,
      status: 'Ordered',
      notes: 'Restock ahead of spring collection'
    },
    {
      orderNumber: 'PO-1001',
      supplier: 'PrintCraft Apparel',
      date: new Date(Date.now() - 4 * 86400000).toISOString(),
      colour: 'White',
      design: 'Neat',
      size: 'Medium',
      quantity: 6,
      status: 'Ordered'
    }
  ],
  packaging: [
    { packagingType: 'Frosted Zip Lock Bags', quantity: 20, minimumQuantity: 50, supplier: 'PackPro SA' },
    { packagingType: 'Stickers', quantity: 140, minimumQuantity: 50, supplier: 'PrintHub' },
    { packagingType: 'Thank You Cards', quantity: 35, minimumQuantity: 40, supplier: 'PrintHub' },
    { packagingType: 'Courier Bags', quantity: 60, minimumQuantity: 30, supplier: 'CourierPack' },
    { packagingType: 'Tissue Paper', quantity: 90, minimumQuantity: 40, supplier: 'PackPro SA' }
  ],
  payments: [
    { customer: 'Naledi M.', orderNumber: 'SO-2041', amount: 660, paid: 660, outstanding: 0, date: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'Paid' },
    { customer: 'Karabo S.', orderNumber: 'SO-2042', amount: 440, paid: 220, outstanding: 220, date: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'Partial' },
    { customer: 'Thandeka N.', orderNumber: 'SO-2043', amount: 220, paid: 0, outstanding: 220, date: new Date().toISOString(), status: 'Outstanding' }
  ],
  settings: {
    businessName: 'ElegantPedi',
    suppliers: [{ name: 'PrintCraft Apparel', contact: '+27 82 000 0000', leadTimeDays: 7 }],
    defaultMinimumStock: 5,
    whatsappNumbers: ['+27 82 000 0000'],
    notificationPreferences: {
      lowStock: true,
      packagingAlert: true,
      supplierOrderAlert: true,
      dailySummary: true,
      weeklyReport: true
    }
  },
  history: [],
  notifications: []
};
