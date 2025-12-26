# FlowHub & Metrc Integration Ideas

This document outlines strategies and ideas for integrating your Union Menu with FlowHub (POS) and Metrc (state tracking/compliance system).

## 🎯 Integration Overview

**Current System:**
- **Union Menu** (Firebase/Firestore) - Customer-facing menu display
- **FlowHub** - Point of Sale system (inventory, sales, pricing)
- **Metrc** - State compliance tracking (traceability, inventory reporting)

**Goal:** Create a unified system where data flows between all three platforms, eliminating manual data entry and ensuring consistency.

---

## 🔄 Integration Strategies

### Strategy 1: **Menu as Display Layer** (Recommended Starting Point)
**Concept:** Menu pulls data from FlowHub/Metrc, serves as read-only display

**Pros:**
- ✅ Menu stays in sync with POS automatically
- ✅ No duplicate data entry
- ✅ Single source of truth (FlowHub/Metrc)

**Cons:**
- ⚠️ Requires API access to FlowHub/Metrc
- ⚠️ More complex initial setup

**Implementation:**
1. FlowHub → Firebase sync script (runs periodically or on-demand)
2. Menu reads from Firebase (current setup)
3. Updates reflect automatically

---

### Strategy 2: **Bidirectional Sync** (Advanced)
**Concept:** Menu can push updates back to FlowHub, full two-way sync

**Pros:**
- ✅ Update prices/status from menu
- ✅ Menu changes reflect in POS
- ✅ Full integration

**Cons:**
- ⚠️ Complex conflict resolution
- ⚠️ Requires robust error handling
- ⚠️ More maintenance

---

### Strategy 3: **Hybrid Approach** (Practical)
**Concept:** Menu syncs FROM FlowHub, manual override capability for specials/features

**Pros:**
- ✅ Best of both worlds
- ✅ Menu stays current with inventory
- ✅ Flexibility for marketing/promotions

**Cons:**
- ⚠️ Need to manage overrides
- ⚠️ More complex logic

---

## 🔌 FlowHub Integration Options

### Option A: FlowHub API Integration

**FlowHub API Capabilities:**
- Read inventory/products
- Read pricing
- Read stock levels
- Potentially update prices/status

**Implementation Steps:**

1. **Set up FlowHub API Access**
   ```
   - Contact FlowHub for API documentation
   - Get API keys/credentials
   - Understand rate limits and endpoints
   ```

2. **Create Sync Service**
   ```javascript
   // Example sync script (Node.js/Cloud Functions)
   async function syncFlowHubToFirebase() {
     // 1. Fetch products from FlowHub API
     const flowHubProducts = await flowHubAPI.getProducts();
     
     // 2. Map FlowHub data to menu format
     const menuProducts = flowHubProducts.map(product => ({
       name: product.name,
       price: product.price,
       category: mapCategory(product.category),
       // ... map other fields
       flowHubId: product.id, // Store reference
       metrcId: product.metrcId, // Link to Metrc
       lastSynced: new Date()
     }));
     
     // 3. Update Firebase
     await updateFirestore(menuProducts);
   }
   ```

3. **Field Mapping Strategy**
   - **FlowHub Product ID** → Store in menu product (for reference)
   - **FlowHub SKU** → Could be used for matching
   - **FlowHub Price** → Menu price (auto-sync)
   - **FlowHub Stock** → Menu isSoldOut status
   - **FlowHub Category** → Map to menu categories

**Fields to Sync:**
- Product name
- Prices
- Stock status (sold out/available)
- Categories
- Descriptions (if available)
- Product images (if available)

---

### Option B: FlowHub Webhook Integration

**How it works:**
- FlowHub sends webhooks when products change
- Your system receives and processes updates
- Menu updates in real-time

**Benefits:**
- Real-time updates
- No polling needed
- Efficient

**Requirements:**
- Webhook endpoint (server/cloud function)
- FlowHub webhook support

---

### Option C: Manual CSV Import/Export

**Fallback Option:**
If API access isn't available, use CSV export/import:

1. Export from FlowHub (daily/manually)
2. Transform CSV to match menu format
3. Import into Firebase
4. Automated script can handle this

**Pros:**
- ✅ Works without API access
- ✅ Simple to implement
- ✅ Reliable

**Cons:**
- ⚠️ Not real-time
- ⚠️ Manual process

---

## 📊 Metrc Integration

### Metrc API Integration

**Metrc Capabilities:**
- Traceability compliance
- Inventory tracking
- Package/lot information
- Testing results (potency, lab data)

**Integration Ideas:**

1. **Link Products to Metrc Packages**
   ```javascript
   {
     name: "Blue Dream",
     price: "$25",
     metrcPackageId: "1A4040300003EE1000000123",
     metrcLabel: "1A4040300003EE1000000123",
     labResults: {
       thc: "24.5%",
       cbd: "0.3%",
       testedDate: "2024-01-15"
     }
   }
   ```

2. **Auto-Update from Metrc**
   - Pull testing results → Display on menu
   - Sync package status → Update availability
   - Compliance data → Staff notes

3. **Display Compliance Info**
   - Show Metrc label on admin view
   - Display lab results to customers
   - Track package movement

**Key Metrc Fields to Integrate:**
- Package ID/Label
- Lab testing results (THC%, CBD%, etc.)
- Harvest date
- Package creation date
- Package status

---

## 🏗️ Implementation Architecture

### Recommended Setup:

```
┌─────────────┐
│   FlowHub   │ ────┐
│    (POS)    │     │
└─────────────┘     │
                    │
┌─────────────┐     │    ┌──────────────┐    ┌─────────────┐
│    Metrc    │ ────┼───▶│   Firebase   │───▶│ Union Menu  │
│(Compliance) │     │    │  (Sync Hub)  │    │  (Display)  │
└─────────────┘     │    └──────────────┘    └─────────────┘
                    │            ▲
                    │            │
                    └────────────┘
                    Sync Service
                    (Cloud Function/
                     Node.js Script)
```

### Data Flow:

1. **FlowHub** → Sync Service → **Firebase** → **Menu**
   - Products, prices, stock status

2. **Metrc** → Sync Service → **Firebase** → **Menu**
   - Lab results, compliance data

3. **Manual Overrides** → **Firebase** → **Menu**
   - Featured items, special descriptions

---

## 🛠️ Technical Implementation

### Option 1: Cloud Functions (Firebase)

**Sync Service as Firebase Cloud Function:**

```javascript
// functions/syncFlowHub.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

exports.syncFlowHub = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async (context) => {
    // Fetch from FlowHub
    const products = await fetchFlowHubProducts();
    
    // Update Firestore
    const batch = admin.firestore().batch();
    products.forEach(product => {
      const ref = admin.firestore()
        .collection(`artifacts/union-live-menu/public/data/${product.category}`)
        .doc(product.id);
      batch.set(ref, product, { merge: true });
    });
    
    await batch.commit();
    console.log(`Synced ${products.length} products`);
  });
```

### Option 2: Node.js Script (Scheduled)

**Run on server/cron job:**

```javascript
// sync-script.js
const flowHub = require('./flowHubAPI');
const admin = require('firebase-admin');

async function sync() {
  const products = await flowHub.getProducts();
  // ... sync logic
}

// Run every 15 minutes via cron
setInterval(sync, 15 * 60 * 1000);
```

### Option 3: Client-Side Sync Button

**Manual sync from admin panel:**

```javascript
// Add to admin panel
async function syncFromFlowHub() {
  showMessage('Syncing from FlowHub...');
  // Call backend sync endpoint
  const response = await fetch('/api/sync-flowhub', { method: 'POST' });
  showMessage('Sync complete!');
}
```

---

## 📋 Implementation Checklist

### Phase 1: Research & Setup
- [ ] Contact FlowHub for API documentation
- [ ] Get FlowHub API credentials/keys
- [ ] Contact Metrc for API access
- [ ] Get Metrc API credentials
- [ ] Understand rate limits for both APIs
- [ ] Map FlowHub fields to menu fields
- [ ] Map Metrc fields to menu fields

### Phase 2: Field Mapping
- [ ] Create mapping document (FlowHub → Menu fields)
- [ ] Create mapping document (Metrc → Menu fields)
- [ ] Define category mapping rules
- [ ] Handle missing/invalid data

### Phase 3: Sync Service
- [ ] Build FlowHub API client
- [ ] Build Metrc API client
- [ ] Create sync function (FlowHub → Firebase)
- [ ] Create sync function (Metrc → Firebase)
- [ ] Handle errors and retries
- [ ] Add logging

### Phase 4: Testing
- [ ] Test with small product set
- [ ] Verify data accuracy
- [ ] Test error handling
- [ ] Performance testing
- [ ] Conflict resolution testing

### Phase 5: Deployment
- [ ] Set up scheduled sync (Cloud Functions/cron)
- [ ] Monitor sync logs
- [ ] Set up alerts for failures
- [ ] Document process

---

## 🎯 Recommended Integration Features

### High Priority:

1. **Auto Stock Status Sync**
   - FlowHub inventory → Menu isSoldOut status
   - Real-time or near real-time

2. **Price Sync**
   - FlowHub prices → Menu prices
   - Prevent manual price entry errors

3. **Product Sync**
   - New products in FlowHub → Auto-add to menu
   - Or manual review first

### Medium Priority:

4. **Metrc Lab Results**
   - Display THC/CBD percentages from Metrc
   - Show testing dates

5. **Package Tracking**
   - Link menu items to Metrc packages
   - Track which packages are available

6. **Inventory Alerts**
   - Low stock alerts based on FlowHub/Metrc data
   - Auto-update menu status

### Low Priority:

7. **Bidirectional Updates**
   - Update FlowHub from menu (if allowed)
   - Mark items sold out from menu

8. **Sales Analytics**
   - Pull sales data from FlowHub
   - Display popular items

---

## 🔐 Security & Compliance

### API Security:
- Store API keys securely (Firebase Functions config, environment variables)
- Never expose keys in client-side code
- Use service accounts where possible

### Data Privacy:
- Only sync necessary product data
- Don't expose sensitive Metrc/FlowHub data publicly
- Comply with state regulations

### Error Handling:
- Log sync failures
- Retry failed syncs
- Alert on repeated failures
- Manual override capability

---

## 💡 Quick Win Ideas

### 1. **FlowHub ID Field**
Add FlowHub product ID to menu products for manual linking:
```javascript
// In shared.js categoryFields, add:
{ id: 'flowHubId', label: 'FlowHub Product ID', type: 'text' }
```

### 2. **Metrc Label Field**
Add Metrc package label for compliance tracking:
```javascript
{ id: 'metrcLabel', label: 'Metrc Package Label', type: 'text' }
```

### 3. **Sync Status Indicator**
Show when product was last synced from FlowHub/Metrc

### 4. **Manual Sync Button**
Add "Sync from FlowHub" button in admin panel (manual trigger)

---

## 📞 Next Steps

1. **Contact FlowHub Support**
   - Ask about API access
   - Request API documentation
   - Understand pricing/limitations

2. **Contact Metrc Support**
   - API access requirements
   - Documentation
   - Compliance considerations

3. **Start Small**
   - Begin with one-way sync (FlowHub → Menu)
   - Test with small product set
   - Expand gradually

4. **Document Everything**
   - API endpoints used
   - Field mappings
   - Error scenarios
   - Sync schedule

---

## 🤝 Questions to Ask FlowHub/Metrc

**FlowHub:**
- Do you have a REST API?
- What endpoints are available for products/inventory?
- Rate limits?
- Webhook support?
- Authentication method?
- Documentation?

**Metrc:**
- API access requirements?
- Available endpoints?
- Can we pull lab results?
- Package tracking APIs?
- Rate limits?
- Documentation?

---

**Note:** Integration complexity depends heavily on API availability and capabilities. Start with research, then prototype small, then scale up. Consider hiring a developer familiar with APIs if needed.

