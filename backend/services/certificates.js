const Order = require('../models/Order');
const User = require('../models/User');
const generateCertificate = require('../utils/generateCertificate');

async function generateForCompletedOrder(order) {
  if (!order || order.status !== 'Completed' || order.certificateUrl) {
    return order && order.certificateUrl;
  }

  try {
    const sponsorId = order.sponsor || order.sponsorId;
    const performerId = order.performer || order.performerId;
    const [sponsor, performer] = await Promise.all([
      sponsorId ? User.findById(sponsorId).select('firstName lastName').lean() : null,
      performerId ? User.findById(performerId).select('firstName lastName').lean() : null,
    ]);

    const certificateUrl = await generateCertificate(order, sponsor || {}, performer || {});
    order.certificateUrl = certificateUrl;
    if (typeof order.save === 'function') {
      await order.save();
    } else {
      await Order.updateOne({ _id: order._id }, { $set: { certificateUrl } });
    }
    return certificateUrl;
  } catch (error) {
    console.error('[CERTIFICATE ERROR]', error.message);
    return null;
  }
}

module.exports = { generateForCompletedOrder };
