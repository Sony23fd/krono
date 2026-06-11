import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const secretToken = process.env.SYNC_SECRET_TOKEN || process.env.POS_SYNC_API_KEY;

    if (!secretToken) {
      console.error('POS Sync Token тохируулагдаагүй байна (.env шалгана уу)');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== secretToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the script from ShopSettings
    const setting = await db.shopSettings.findUnique({
      where: { key: 'POS_SYNC_SCRIPT' }
    });

    if (!setting || !setting.value) {
      return NextResponse.json({ success: false, error: 'Script not found' }, { status: 404 });
    }

    // Return the script as plain text (or JSON, but plain text is fine)
    // We'll return it as text so the runner can just save it.
    return new NextResponse(setting.value, {
      status: 200,
      headers: {
        'Content-Type': 'text/javascript'
      }
    });

  } catch (error: any) {
    console.error('[API pos-script GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
