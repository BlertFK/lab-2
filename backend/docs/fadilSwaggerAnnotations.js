/**
 * @swagger
 * tags:
 *   - name: Properties
 *   - name: Favorites
 *   - name: Viewings
 *   - name: Offers
 *   - name: Transactions
 *   - name: Reviews
 *   - name: Agencies
 *   - name: Agents
 *   - name: Messages
 *   - name: Plans
 *   - name: Reports
 *   - name: Lookups
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/properties:
 *   get:
 *     tags: [Properties]
 *     summary: List properties with optional search and filters.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *     responses:
 *       200: { description: Properties returned. }
 *   post:
 *     tags: [Properties]
 *     summary: Create a seller property listing.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, price, location, type]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               location: { type: string }
 *               type: { type: string }
 *               status: { type: string }
 *               image_url: { type: string }
 *     responses:
 *       201: { description: Property created. }
 *       403: { description: Seller role or listing quota required. }
 * /api/properties/my:
 *   get:
 *     tags: [Properties]
 *     summary: List properties owned by the authenticated seller.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Seller properties returned. }
 * /api/properties/{id}:
 *   get:
 *     tags: [Properties]
 *     summary: Get property details.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Property returned. }
 *   put:
 *     tags: [Properties]
 *     summary: Update a seller-owned property.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Property updated. }
 *   delete:
 *     tags: [Properties]
 *     summary: Delete a seller-owned property.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Property deleted. }
 * /api/properties/{propertyId}/images:
 *   get:
 *     tags: [Properties]
 *     summary: List property images.
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Images returned. }
 *   post:
 *     tags: [Properties]
 *     summary: Attach image URL or file reference to a property.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201: { description: Image attached. }
 * /api/properties/{propertyId}/images/{imageId}:
 *   delete:
 *     tags: [Properties]
 *     summary: Detach property image.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Image detached. }
 * /api/properties/{propertyId}/images/{imageId}/primary:
 *   patch:
 *     tags: [Properties]
 *     summary: Mark property image as primary.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Primary image updated. }
 * /api/properties/{propertyId}/amenities:
 *   get:
 *     tags: [Properties]
 *     summary: List property amenities.
 *     responses:
 *       200: { description: Amenities returned. }
 *   post:
 *     tags: [Properties]
 *     summary: Attach amenity to property.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Amenity attached. }
 * /api/properties/{propertyId}/amenities/{amenityId}:
 *   delete:
 *     tags: [Properties]
 *     summary: Detach amenity from property.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Amenity detached. }
 */

/**
 * @swagger
 * /api/property-types:
 *   get:
 *     tags: [Lookups]
 *     summary: List property types.
 *     responses:
 *       200: { description: Property types returned. }
 * /api/categories:
 *   get:
 *     tags: [Lookups]
 *     summary: List categories.
 *     responses:
 *       200: { description: Categories returned. }
 * /api/cities:
 *   get:
 *     tags: [Lookups]
 *     summary: List cities.
 *     responses:
 *       200: { description: Cities returned. }
 * /api/amenities:
 *   get:
 *     tags: [Lookups]
 *     summary: List amenities.
 *     responses:
 *       200: { description: Amenities returned. }
 */

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     tags: [Favorites]
 *     summary: List buyer favorites.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Favorites returned. }
 * /api/favorites/{propertyId}:
 *   post:
 *     tags: [Favorites]
 *     summary: Add property to favorites.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Favorite created. }
 *   delete:
 *     tags: [Favorites]
 *     summary: Remove property from favorites.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Favorite removed. }
 */

/**
 * @swagger
 * /api/viewings:
 *   get:
 *     tags: [Viewings]
 *     summary: List viewings for the authenticated user.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Viewings returned. }
 *   post:
 *     tags: [Viewings]
 *     summary: Buyer requests a viewing.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Viewing requested. }
 * /api/viewings/{id}:
 *   get:
 *     tags: [Viewings]
 *     summary: Get viewing by id.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Viewing returned. }
 * /api/viewings/{id}/status:
 *   patch:
 *     tags: [Viewings]
 *     summary: Update viewing status.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Viewing status updated. }
 */

/**
 * @swagger
 * /api/offers:
 *   get:
 *     tags: [Offers]
 *     summary: List offers for the authenticated user.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Offers returned. }
 *   post:
 *     tags: [Offers]
 *     summary: Buyer creates an offer.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Offer created. }
 * /api/offers/{id}:
 *   get:
 *     tags: [Offers]
 *     summary: Get offer by id.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Offer returned. }
 * /api/offers/{id}/counter:
 *   post:
 *     tags: [Offers]
 *     summary: Seller creates a counter-offer.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Counter-offer created. }
 * /api/offers/{id}/status:
 *   patch:
 *     tags: [Offers]
 *     summary: Accept, reject, withdraw, or expire offer.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Offer status updated. }
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: List transactions for authenticated user.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Transactions returned. }
 * /api/transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get transaction by id.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Transaction returned. }
 * /api/transactions/{id}/status:
 *   patch:
 *     tags: [Transactions]
 *     summary: Update transaction state.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Transaction updated. }
 */

/**
 * @swagger
 * /api/reviews/property/{propertyId}:
 *   get:
 *     tags: [Reviews]
 *     summary: List reviews for a property.
 *     responses:
 *       200: { description: Reviews returned. }
 * /api/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Buyer creates verified review after completed transaction.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Review created. }
 * /api/reviews/{id}/hide:
 *   patch:
 *     tags: [Reviews]
 *     summary: Admin hides a review.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Review hidden. }
 * /api/reviews/{id}/unhide:
 *   patch:
 *     tags: [Reviews]
 *     summary: Admin unhides a review.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Review unhidden. }
 */

/**
 * @swagger
 * /api/agencies:
 *   get:
 *     tags: [Agencies]
 *     summary: List agencies.
 *     responses:
 *       200: { description: Agencies returned. }
 *   post:
 *     tags: [Agencies]
 *     summary: Create agency.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Agency created. }
 * /api/agencies/{id}:
 *   get:
 *     tags: [Agencies]
 *     summary: Get agency by id.
 *     responses:
 *       200: { description: Agency returned. }
 *   put:
 *     tags: [Agencies]
 *     summary: Update agency.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Agency updated. }
 * /api/agencies/{agencyId}/agents:
 *   get:
 *     tags: [Agencies]
 *     summary: List agents for agency.
 *     responses:
 *       200: { description: Agency agents returned. }
 */

/**
 * @swagger
 * /api/agents:
 *   get:
 *     tags: [Agents]
 *     summary: List agents.
 *     responses:
 *       200: { description: Agents returned. }
 *   post:
 *     tags: [Agents]
 *     summary: Create agent profile.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Agent created. }
 * /api/agents/{id}:
 *   get:
 *     tags: [Agents]
 *     summary: Get agent by id.
 *     responses:
 *       200: { description: Agent returned. }
 *   put:
 *     tags: [Agents]
 *     summary: Update agent.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Agent updated. }
 * /api/agents/{id}/status:
 *   patch:
 *     tags: [Agents]
 *     summary: Update agent status.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Agent status updated. }
 */

/**
 * @swagger
 * /api/messages:
 *   post:
 *     tags: [Messages]
 *     summary: Buyer sends legacy property inquiry message.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Message sent. }
 * /api/messages/seller:
 *   get:
 *     tags: [Messages]
 *     summary: Seller lists legacy inquiry messages.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Seller messages returned. }
 * /api/messages/{id}/read:
 *   patch:
 *     tags: [Messages]
 *     summary: Mark message as read.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Message marked read. }
 * /api/threads:
 *   get:
 *     tags: [Messages]
 *     summary: List message threads.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Threads returned. }
 *   post:
 *     tags: [Messages]
 *     summary: Create or fetch message thread.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Thread created. }
 * /api/threads/{id}/messages:
 *   get:
 *     tags: [Messages]
 *     summary: List messages in thread.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Thread messages returned. }
 *   post:
 *     tags: [Messages]
 *     summary: Send message to thread.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Thread message sent. }
 */

/**
 * @swagger
 * /api/plans:
 *   get:
 *     tags: [Plans]
 *     summary: List active plans.
 *     responses:
 *       200: { description: Plans returned. }
 * /api/plans/subscription/me:
 *   get:
 *     tags: [Plans]
 *     summary: Get authenticated user's current subscription.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Subscription returned. }
 * /api/plans/subscribe:
 *   post:
 *     tags: [Plans]
 *     summary: Subscribe authenticated user to a plan.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Subscription updated. }
 */

/**
 * @swagger
 * /api/reports/sales:
 *   get:
 *     tags: [Reports]
 *     summary: Sales by period report.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Report returned. }
 * /api/reports/listings:
 *   get:
 *     tags: [Reports]
 *     summary: Listings by status report.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Report returned. }
 * /api/reports/top-properties:
 *   get:
 *     tags: [Reports]
 *     summary: Top properties by views report.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Report returned. }
 * /api/reports/revenue-by-agent:
 *   get:
 *     tags: [Reports]
 *     summary: Revenue by agent report.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Report returned. }
 * /api/reports/pending-offers-aging:
 *   get:
 *     tags: [Reports]
 *     summary: Pending offers aging report.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Report returned. }
 * /api/reports/active-subscriptions:
 *   get:
 *     tags: [Reports]
 *     summary: Active subscriptions report.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Report returned. }
 * /api/reports/{report}/export:
 *   get:
 *     tags: [Reports]
 *     summary: Export supported report as csv, excel, or pdf.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: report
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sales, listings, top-properties, revenue-by-agent, pending-offers-aging, active-subscriptions]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel, pdf]
 *     responses:
 *       200: { description: Export file returned. }
 */

module.exports = {};
