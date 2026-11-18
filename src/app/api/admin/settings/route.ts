import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import {
  sanitizeMetaPixelId,
  sanitizeTikTokPixelId,
  sanitizeGa4Id,
} from '@/lib/analytics';

export async function GET() {
  try {
    const store = await prisma.store.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!store) return NextResponse.json({ store: null });
    const {
      adminPasskeyHash: _hidden,
      adminSessionVersion: _ver,
      whatsappAgentToken: _waToken,
      whatsappAgentRecipientId: _waRecipient,
      ...safeStore
    } = store;
    return NextResponse.json({ store: safeStore });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      legalName,
      logoText,
      supportEmail,
      supportPhone,
      supportCity,
      contactAddress,
      enableAnnouncement,
      announcement,
      heroTag,
      heroTitle,
      heroDescription,
      heroImageUrl,
      heroCtaText,
      heroCtaLink,
      valueProp1,
      valueProp2,
      valueProp3,
      catalogTitle,
      catalogSubtitle,
      communityTitle,
      communitySubtitle,
      communityLink,
      communityCtaText,
      enableSocialLinks,
      enableInstagram,
      enableTiktok,
      enableYoutube,
      enableWhatsApp,
      enableFloatingWhatsApp,
      whatsappNumber,
      whatsappDefaultMsg,
      instagramUrl,
      tiktokUrl,
      youtubeUrl,
      freeShippingThreshold,
      shippingFee,
      estimatedDeliveryDays,
      enableCod,
      enableCard,
      codNotice,
      enableBankTransfer,
      bankName,
      bankAccountTitle,
      bankAccountNumber,
      bankIban,
      bankBranch,
      bankInstructions,
      enableInternationalTransfer,
      internationalTitle,
      payoneerAccount,
      paypalAccount,
      wiseAccount,
      internationalInstructions,
      cardGatewayName,
      cardInstructions,
      cardMode,
      policyRefund,
      policyShipping,
      policyTerms,
      policyPrivacy,
      policyContact,
      metaPixelId,
      tiktokPixelId,
      ga4MeasurementId,
    } = body;

    // Validate Pixel IDs strictly when non-empty to prevent malformed/unsafe scripts
    if (typeof metaPixelId === 'string' && metaPixelId.trim() !== '' && !sanitizeMetaPixelId(metaPixelId)) {
      return NextResponse.json(
        { error: 'Invalid Meta Pixel ID. It should contain digits only (e.g. 123456789012345).' },
        { status: 400 }
      );
    }
    if (typeof tiktokPixelId === 'string' && tiktokPixelId.trim() !== '' && !sanitizeTikTokPixelId(tiktokPixelId)) {
      return NextResponse.json(
        { error: 'Invalid TikTok Pixel ID. Use letters and numbers only (e.g. C1234567890ABCDEF).' },
        { status: 400 }
      );
    }
    if (typeof ga4MeasurementId === 'string' && ga4MeasurementId.trim() !== '' && !sanitizeGa4Id(ga4MeasurementId)) {
      return NextResponse.json(
        { error: 'Invalid Google Analytics 4 ID. Format must start with G- (e.g. G-XXXXXXXXXX).' },
        { status: 400 }
      );
    }

    let store = await prisma.store.findFirst({ orderBy: { createdAt: 'asc' } });

    const dataToSave = {
      ...(name !== undefined && { name }),
      ...(legalName !== undefined && { legalName }),
      ...(logoText !== undefined && { logoText }),
      ...(supportEmail !== undefined && { supportEmail }),
      ...(supportPhone !== undefined && { supportPhone }),
      ...(supportCity !== undefined && { supportCity }),
      ...(contactAddress !== undefined && { contactAddress }),
      ...(enableAnnouncement !== undefined && { enableAnnouncement: Boolean(enableAnnouncement) }),
      ...(announcement !== undefined && { announcement }),
      ...(heroTag !== undefined && { heroTag }),
      ...(heroTitle !== undefined && { heroTitle }),
      ...(heroDescription !== undefined && { heroDescription }),
      ...(heroImageUrl !== undefined && { heroImageUrl }),
      ...(heroCtaText !== undefined && { heroCtaText }),
      ...(heroCtaLink !== undefined && { heroCtaLink }),
      ...(valueProp1 !== undefined && { valueProp1 }),
      ...(valueProp2 !== undefined && { valueProp2 }),
      ...(valueProp3 !== undefined && { valueProp3 }),
      ...(catalogTitle !== undefined && { catalogTitle }),
      ...(catalogSubtitle !== undefined && { catalogSubtitle }),
      ...(communityTitle !== undefined && { communityTitle }),
      ...(communitySubtitle !== undefined && { communitySubtitle }),
      ...(communityLink !== undefined && { communityLink }),
      ...(communityCtaText !== undefined && { communityCtaText }),
      ...(enableSocialLinks !== undefined && { enableSocialLinks: Boolean(enableSocialLinks) }),
      ...(enableInstagram !== undefined && { enableInstagram: Boolean(enableInstagram) }),
      ...(enableTiktok !== undefined && { enableTiktok: Boolean(enableTiktok) }),
      ...(enableYoutube !== undefined && { enableYoutube: Boolean(enableYoutube) }),
      ...(enableWhatsApp !== undefined && { enableWhatsApp: Boolean(enableWhatsApp) }),
      ...(enableFloatingWhatsApp !== undefined && { enableFloatingWhatsApp: Boolean(enableFloatingWhatsApp) }),
      ...(whatsappNumber !== undefined && { whatsappNumber }),
      ...(whatsappDefaultMsg !== undefined && { whatsappDefaultMsg }),
      ...(instagramUrl !== undefined && { instagramUrl }),
      ...(tiktokUrl !== undefined && { tiktokUrl }),
      ...(youtubeUrl !== undefined && { youtubeUrl }),
      ...(freeShippingThreshold !== undefined && {
        freeShippingThreshold: Number(freeShippingThreshold),
      }),
      ...(shippingFee !== undefined && { shippingFee: Number(shippingFee) }),
      ...(estimatedDeliveryDays !== undefined && { estimatedDeliveryDays }),
      ...(enableCod !== undefined && { enableCod: Boolean(enableCod) }),
      ...(enableCard !== undefined && { enableCard: Boolean(enableCard) }),
      ...(codNotice !== undefined && { codNotice }),
      ...(enableBankTransfer !== undefined && { enableBankTransfer: Boolean(enableBankTransfer) }),
      ...(bankName !== undefined && { bankName }),
      ...(bankAccountTitle !== undefined && { bankAccountTitle }),
      ...(bankAccountNumber !== undefined && { bankAccountNumber }),
      ...(bankIban !== undefined && { bankIban }),
      ...(bankBranch !== undefined && { bankBranch }),
      ...(bankInstructions !== undefined && { bankInstructions }),
      ...(enableInternationalTransfer !== undefined && {
        enableInternationalTransfer: Boolean(enableInternationalTransfer),
      }),
      ...(internationalTitle !== undefined && { internationalTitle }),
      ...(payoneerAccount !== undefined && { payoneerAccount }),
      ...(paypalAccount !== undefined && { paypalAccount }),
      ...(wiseAccount !== undefined && { wiseAccount }),
      ...(internationalInstructions !== undefined && { internationalInstructions }),
      ...(cardGatewayName !== undefined && { cardGatewayName }),
      ...(cardInstructions !== undefined && { cardInstructions }),
      ...(cardMode !== undefined && { cardMode }),
      ...(policyRefund !== undefined && { policyRefund }),
      ...(policyShipping !== undefined && { policyShipping }),
      ...(policyTerms !== undefined && { policyTerms }),
      ...(policyPrivacy !== undefined && { policyPrivacy }),
      ...(policyContact !== undefined && { policyContact }),
      ...(metaPixelId !== undefined && { metaPixelId: sanitizeMetaPixelId(metaPixelId) }),
      ...(tiktokPixelId !== undefined && { tiktokPixelId: sanitizeTikTokPixelId(tiktokPixelId) }),
      ...(ga4MeasurementId !== undefined && { ga4MeasurementId: sanitizeGa4Id(ga4MeasurementId) }),
    };

    if (!store) {
      store = await prisma.store.create({
        data: {
          id: 'store_pairs_blades',
          handle: 'pairs-blades',
          name: name || 'Pairs Knife & Sword Co.',
          ...dataToSave,
        },
      });
    } else {
      store = await prisma.store.update({
        where: { id: store.id },
        data: dataToSave,
      });
    }

    // Invalidate caches across the entire site
    revalidatePath('/', 'layout');
    revalidatePath('/adminusman', 'layout');
    revalidatePath('/adminusman');
    revalidatePath('/adminusman/login');
    revalidatePath('/adminusman/settings');
    revalidatePath('/checkout');
    revalidatePath('/collections/all');
    revalidatePath('/policies/refund-policy');
    revalidatePath('/policies/shipping-policy');
    revalidatePath('/policies/terms-of-service');
    revalidatePath('/policies/privacy-policy');
    revalidatePath('/policies/contact-information');

    const {
      adminPasskeyHash: _hidden,
      adminSessionVersion: _ver,
      whatsappAgentToken: _waToken,
      whatsappAgentRecipientId: _waRecipient,
      ...safeStore
    } = store;
    return NextResponse.json({ success: true, store: safeStore });
  } catch (err: any) {
    console.error('Settings save error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  return POST(req);
}
