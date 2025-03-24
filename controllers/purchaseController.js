const Stripe = require("stripe");
const UserModel = require("../models/user.model");
const PackageModel = require("../models/packages.model");
const PurchasedPackageModel = require("../models/purchasedPackage.model");
const Message = require("../models/messeges.model");
const { sendPurchaseConfirmationEmail, sendAdminBookingNotification, sendRefundConfirmationEmail } = require("../utils/emailService");
const userModel = require("../models/user.model");
const { default: axios } = require("axios");
const { generatePassword, calculateNetAmount } = require("../utils/validation");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const purchaseController = () => {
    return {
        createPurchase: async (req, res) => {
            try {
                const { packageId, price, addOns } = req.body?.packageDetails;
                const {
                    userId,
                    fullName,
                    email,
                    phone,
                    address,
                    dob,
                    gender,
                    passportNumber,
                    passportExpiry,
                    checkInDate,
                    checkOutDate,
                    guestDetails,
                    countryCode,
                } = req.body?.formData;

                const cityPackage = await PackageModel.findOne({ "packages._id": packageId });
                if (!cityPackage) {
                    return res.status(404).json({ error: "Package not found" });
                }

                const selectedPackage = cityPackage.packages.find(pkg => pkg._id.toString() === packageId);
                if (!selectedPackage) {
                    return res.status(404).json({ error: "Package not found in city" });
                }

                if (!selectedPackage.price || selectedPackage.price <= 0) {
                    return res.status(400).json({ error: "Invalid package price" });
                }

                const purchasedAddOns = addOns?.map(addOn => ({
                    name: addOn?.name,
                    price: addOn?.price,
                    currency: addOn?.currency || "USD"
                }));

                const servicesDescription = selectedPackage.services?.length
                    ? `Services included: ${selectedPackage.services.map(s => typeof s === "string" ? s : s.name).join(" – ")}`
                    : "No services";

                const addOnsDescription = purchasedAddOns.length
                    ? `Selected Add-Ons: ${purchasedAddOns.map(a => `${a.name}`).join(" • ")}`
                    : "No add-ons";

                const fullDescription = `${servicesDescription}  |  ${addOnsDescription}`;

                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ["card"],
                    mode: "payment",
                    customer_email: email,
                    line_items: [
                        {
                            price_data: {
                                currency: "usd",
                                product_data: {
                                    name: selectedPackage.name,
                                    description: fullDescription,
                                },
                                unit_amount: price * 100,
                            },
                            quantity: 1,
                        },
                    ],
                    metadata: {
                        packageId: packageId,
                        userId: userId || "guest",
                        city: cityPackage.city,
                        packageName: selectedPackage.name,
                        fullName,
                        email,
                        phone,
                        address: JSON.stringify(address),
                        addressLine1: address?.addressLine1,
                        addressLine2: address?.addressLine2,
                        // street: address?.street,
                        city: address?.city,
                        state: address?.state,
                        country: address?.country,
                        postalCode: address?.postalCode,
                        dob,
                        gender,
                        passportNumber,
                        passportExpiry,
                        checkInDate,
                        checkOutDate,
                        guestDetails: JSON.stringify(guestDetails),
                        countryCode,
                        addOns: JSON.stringify(purchasedAddOns),
                        price,
                        registrationStatus: userId ? "authenticated" : "pending"
                    },
                    success_url: `${process.env.FRONTEND_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${process.env.FRONTEND_URL}/purchase/cancel?session_id={CHECKOUT_SESSION_ID}`,
                });

                return res.json({
                    sessionId: session.id,
                    message: "Proceed with payment to confirm purchase"
                });

            } catch (error) {
                console.error("Purchase Creation Error:", error);
                return res.status(500).json({
                    error: "Failed to initiate purchase. Please try again.",
                    details: error.message
                });
            }
        },

        handleWebhook: async (req, res) => {
            const sig = req.headers["stripe-signature"];
            try {
                const event = stripe.webhooks.constructEvent(
                    req.body,
                    sig,
                    process.env.STRIPE_WEBHOOK_SECRET
                );

                if (event.type === "checkout.session.completed") {
                    await handlePaymentSuccess(event.data.object);
                } else if (event.type === "charge.updated") {
                    await handleChargeSuccess(event.data.object);
                } else if (event.type === "checkout.session.expired") {
                    await handlePaymentCancelled(event.data.object);
                } else {
                    console.log(`Ignoring unhandled event type: ${event.type}`);
                }

                return res.json({ received: true });
            } catch (err) {
                console.error("Webhook Error:", err.message);
                return res.status(400).send(`Webhook Error: ${err.message}`);
            }
        },

        getSessionData: async (req, res) => {
            const { sessionId } = req.params;
            try {
                const session = await stripe.checkout.sessions.retrieve(sessionId);
                if (!session.payment_intent) {
                    return res.status(400).json({ error: "Payment intent not found in session" });
                }

                const purchase = await PurchasedPackageModel.findOne({ paymentIntentId: session.payment_intent })
                    .populate('userId', 'email firstName lastName');
                if (!purchase) {
                    return res.status(404).json({ error: "Purchase not found" });
                }

                return res.json({
                    customer_email: session.customer_email,
                    registrationStatus: purchase.registrationStatus || session.metadata.registrationStatus,
                    userId: purchase.userId._id,
                    email: purchase.userId.email,
                    fullName: `${purchase.userId.firstName} ${purchase.userId.lastName}`.trim()
                });
            } catch (error) {
                console.error("Error retrieving purchase status:", error);
                return res.status(500).json({ error: "Failed to retrieve purchase status" });
            }
        },

        refundPayment: async (req, res) => {
            const { bookingId } = req.params;

            try {
                const booking = await PurchasedPackageModel.findById(bookingId).populate('userId', '-password');
                if (!booking) {
                    return res.status(404).json({ message: "Booking not found." });
                }
                const cityPackage = await PackageModel.findOne({ "packages._id": booking.packageId });

                const selectedPackage = cityPackage.packages.find(pkg => pkg._id.toString() === booking.packageId.toString());

                if (booking.status !== 'completed' && booking.status !== 'pending') {
                    return res.status(400).json({ message: "Booking is not eligible for a refund." });
                }

                if (!booking.paymentIntentId) {
                    return res.status(400).json({ message: "No payment information found for this booking." });
                }

                const paymentIntent = await stripe.paymentIntents.retrieve(booking.paymentIntentId);
                if (paymentIntent.currency.toLowerCase() !== 'usd') {
                    return res.status(400).json({
                        message: `Cannot process refund: Payment was made in ${paymentIntent.currency.toUpperCase()}, but only USD payments are supported.`,
                    });
                }

                const totalAmountInCents = paymentIntent.amount;
                const amountRefundedInCents = paymentIntent.amount_refunded;
                const unrefundedAmountInCents = totalAmountInCents - amountRefundedInCents;
                const unrefundedAmountInDollars = unrefundedAmountInCents / 100;

                if (unrefundedAmountInCents <= 0) {
                    return res.status(400).json({
                        message: "No amount left to refund. The charge has already been fully refunded.",
                    });
                }

                const netAmountInDollars = booking.netAmount || booking.amount;
                const refundedAmountInDollars = booking.refundedAmount || 0;
                const remainingRefundableAmountInDollars = netAmountInDollars - refundedAmountInDollars;
                const remainingRefundableAmountInCents = Math.round(remainingRefundableAmountInDollars * 100);

                if (remainingRefundableAmountInCents <= 0) {
                    return res.status(400).json({
                        message: "No amount left to refund. The booking has already been fully refunded.",
                    });
                }

                const refundAmountInDollars = remainingRefundableAmountInDollars;
                const refundAmountInCents = Math.round(refundAmountInDollars * 100);

                if (refundAmountInCents > unrefundedAmountInCents) {
                    return res.status(400).json({
                        message: `Refund amount ($${refundAmountInDollars.toFixed(2)}) is greater than the unrefunded amount on the charge ($${unrefundedAmountInDollars.toFixed(2)}).`,
                    });
                }

                const refund = await stripe.refunds.create({
                    payment_intent: booking.paymentIntentId,
                    amount: refundAmountInCents,
                });

                booking.status = 'refunded';
                booking.refundedAmount = (booking.refundedAmount || 0) + (refund.amount / 100);
                await booking.save();

                const fullName = `${booking.userId?.firstName} ${booking.userId?.middleName || ''} ${booking.userId?.lastName}`.trim();
                const userEmail = booking.userId?.email;
                const packageName = selectedPackage?.name || 'Unknown Package';
                const refundId = refund.id;
                const checkInDate = booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : 'N/A';
                const checkOutDate = booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : 'N/A';
                const guestDetails = booking.guestDetails || 'N/A';
                const stripeFee = booking.stripeFee || 0;

                await sendRefundConfirmationEmail(
                    userEmail,
                    fullName,
                    packageName,
                    bookingId,
                    refundAmountInDollars,
                    refundId,
                    checkInDate,
                    checkOutDate,
                    guestDetails,
                    stripeFee
                );

                res.status(200).json({
                    message: "Refund processed successfully.",
                    refundId: refund.id,
                    booking,
                    refundedAmount: refund.amount / 100,
                });
            } catch (error) {
                console.error("Error processing refund:", error);
                res.status(500).json({ message: "Server error", error: error.message });
            }
        }
    }
}

const handlePaymentSuccess = async (session) => {
    try {
        const { metadata, customer_email } = session;

        let purchase = await PurchasedPackageModel.findOne({
            paymentIntentId: session.payment_intent
        });
        if (purchase) {
            console.log(`Purchase already processed for payment intent: ${session.payment_intent}`);
            return;
        }

        let user;
        let registrationStatus = metadata.registrationStatus;

        if (metadata.userId !== "guest") {
            user = await UserModel.findById(metadata.userId);
            if (!user) {
                console.error(`User with ID ${metadata.userId} not found for authenticated purchase`);
                return;
            }
            registrationStatus = "authenticated";
        } else {
            user = await UserModel.findOne({ email: customer_email });
            if (user) {
                registrationStatus = "existing";
            } else {
                try {
                    const randomPassword = generatePassword();
                    const registerResponse = await axios.post(`${process.env.API_URL}/api/auth/register`, {
                        email: customer_email,
                        firstName: metadata.fullName?.split(" ")[0] || "Guest",
                        lastName: metadata.fullName?.split(" ")[1] || "",
                        countryCode: metadata.countryCode,
                        phoneNumber: metadata.phone,
                        address: {
                            addressLine1: metadata.addressLine1,
                            addressLine2: metadata.addressLine2,
                            // street: metadata.street,
                            city: metadata.city,
                            state: metadata.state,
                            country: metadata.country,
                            postalCode: metadata.postalCode
                        },
                        location: metadata.city,
                        dob: metadata.dob,
                        gender: metadata.gender,
                        passportNumber: metadata.passportNumber,
                        passportExpiry: metadata.passportExpiry,
                        password: randomPassword,
                        returnUrl: "/user/profile?tab=orders",
                    });
                    const registeredUser = registerResponse.data.user;
                    user = await UserModel.findById(registeredUser.id);
                    registrationStatus = "new";
                } catch (registerError) {
                    console.error("Registration API Error:", registerError);
                    user = new UserModel({
                        email: customer_email,
                        firstName: metadata.fullName?.split(" ")[0] || "Guest",
                        lastName: metadata.fullName?.split(" ")[1] || "",
                        countryCode: metadata.countryCode,
                        phoneNumber: metadata.phone,
                        address: {
                            addressLine1: metadata.addressLine1,
                            addressLine2: metadata.addressLine2,
                            // street: metadata.street,
                            city: metadata.city,
                            state: metadata.state,
                            country: metadata.country,
                            postalCode: metadata.postalCode
                        },
                        location: metadata.city,
                        dob: metadata.dob,
                        gender: metadata.gender,
                        passportNumber: metadata.passportNumber,
                        passportExpiryDate: metadata.passportExpiry
                    });
                    await user.save();
                    console.log("Fallback user created:", user._id);
                    registrationStatus = "new-fallback";
                }
            }
        }

        if (registrationStatus === "existing" || registrationStatus === "authenticated") {
            user.firstName = metadata.fullName?.split(" ")[0] || user.firstName;
            user.lastName = metadata.fullName?.split(" ")[1] || user.lastName;
            user.countryCode = metadata.countryCode || user.countryCode;
            user.phoneNumber = metadata.phone || user.phoneNumber;
            user.address.addressLine1 = metadata.addressLine1 || user.address?.addressLine1;
            user.address.addressLine2 = metadata.addressLine2 || user.address?.addressLine2;
            // user.address.street = metadata.street || user.address?.street;
            user.address.city = metadata.city || user.address?.city;
            user.address.state = metadata.state || user.address?.state;
            user.address.country = metadata.country || user.address?.country;
            user.address.postalCode = metadata.postalCode || user.address?.postalCode;
            user.location = metadata.city || user.location;
            user.dob = metadata.dob || user.dob;
            user.gender = metadata.gender || user.gender;
            user.passportNumber = metadata.passportNumber || user.passportNumber;
            user.passportExpiryDate = metadata.passportExpiry || user.passportExpiryDate;
            await user.save();
        }

        const purchasedAddOns = JSON.parse(metadata.addOns);
        purchase = new PurchasedPackageModel({
            packageId: metadata.packageId,
            userId: user._id,
            amount: session.amount_total / 100,
            // netAmount: netAmountInDollars,
            status: "completed",
            purchasedAt: new Date(),
            paymentIntentId: session.payment_intent,
            checkInDate: metadata.checkInDate,
            checkOutDate: metadata.checkOutDate,
            guestDetails: JSON.parse(metadata.guestDetails),
            addOns: purchasedAddOns,
            registrationStatus: registrationStatus
        });

        await purchase.save();

        await sendPurchaseConfirmationEmail(
            customer_email,
            metadata.fullName,
            metadata.packageName,
            purchase._id.toString(),
            metadata.checkInDate,
            metadata.checkOutDate,
            metadata.guestDetails,
            session.amount_total / 100,
            metadata.addOns
        );

        const cityPackage = await PackageModel.findOne({ "packages._id": metadata.packageId });
        const employee = await UserModel.findOne({
            location: { $regex: cityPackage?.city || metadata.city, $options: 'i' },
            role: "employee",
        });

        if (employee) {
            const messageContent = `My booking details are as below:\nBooking ID: ${purchase._id}\nDestination: ${metadata.city}\nPackage: ${metadata.packageName}`;
            const existingMessage = await Message.findOne({
                senderId: user._id,
                receiverId: employee._id,
                content: messageContent,
            });

            if (!existingMessage) {
                const message = new Message({
                    senderId: user._id,
                    receiverId: employee._id,
                    content: messageContent,
                    isRead: false,
                });
                await message.save();

                await sendAdminBookingNotification(
                    employee.email,
                    metadata.fullName,
                    customer_email,
                    metadata.packageName,
                    purchase._id.toString(),
                    metadata.checkInDate,
                    metadata.checkOutDate,
                    metadata.guestDetails,
                    session.amount_total / 100,
                    metadata.addOns
                );
            }
        }

        console.log(`Purchase successfully processed for email: ${customer_email} with status: ${registrationStatus}`);
    } catch (error) {
        console.error("Error handling payment success:", error);
    }
};

const handleChargeSuccess = async (charge) => {
    try {
        const purchase = await PurchasedPackageModel.findOne({
            paymentIntentId: charge.payment_intent
        });

        if (!purchase) {
            console.error(`No purchase found for payment intent: ${charge.payment_intent}`);
            return;
        }

        if (purchase.stripeFee && purchase.netAmount) {
            console.log(`Fee details already processed for purchase: ${purchase._id}`);
            return;
        }

        if (!charge.balance_transaction) {
            console.error(`Balance transaction still not available for charge: ${charge.id}`);
            return;
        }

        const balanceTransaction = await stripe.balanceTransactions.retrieve(charge.balance_transaction);

        const totalAmountInCents = charge.amount; // e.g., 35000 cents ($350)
        const stripeFeeInCents = balanceTransaction.fee; // e.g., 1045 cents ($10.45)
        const stripeFeeInDollars = stripeFeeInCents / 100;
        const netAmountInCents = totalAmountInCents - stripeFeeInCents; // e.g., 33955 cents ($339.55)
        const netAmountInDollars = netAmountInCents / 100;

        purchase.stripeFee = stripeFeeInDollars;
        purchase.netAmount = netAmountInDollars;
        await purchase.save();

        console.log(`Updated purchase ${purchase._id}: Total: $${purchase.amount}, Fee: $${stripeFeeInDollars}, Net: $${netAmountInDollars}`);
    } catch (error) {
        console.error("Error handling charge success:", error.message);
    }
};

const handlePaymentCancelled = async (session) => {
    try {
        let purchaseId;
        if (session.metadata?.purchaseId) {
            purchaseId = session.metadata.purchaseId;
        } else if (session.payment_intent) {
            const purchase = await PurchasedPackageModel.findOne({ paymentIntentId: session.payment_intent });
            if (purchase) {
                purchaseId = purchase._id.toString();
            }
        }

        if (!purchaseId) {
            console.error(" No purchaseId found in session metadata or paymentIntent.");
            return;
        }

        const purchase = await PurchasedPackageModel.findById(purchaseId);
        if (!purchase) {
            console.error(` Purchase not found for ID: ${purchaseId}`);
            return;
        }

        purchase.status = "failed";
        await purchase.save();

        console.log(` Payment failed/expired. Order marked as failed for purchase ID: ${purchaseId}`);
    } catch (error) {
        console.error("⚠️ Error handling payment cancellation:", error);
    }
};

module.exports = purchaseController;
