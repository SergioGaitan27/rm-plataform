import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Container from '@/models/containerModel';

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const body = await req.json();
    const { containerNumber, products } = body;

    const newContainer = new Container({
      containerNumber,
      products,
      status: 'preloaded'
    });

    await newContainer.save();

    return NextResponse.json({ success: true, data: newContainer }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'An unknown error occurred' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = {};
    if (status) {
      query = { status: { $in: status.split(',') } };
    }

    const containers = await Container.find(query);
    return NextResponse.json({ success: true, data: containers });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'An unknown error occurred' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  await connectDB();

  try {
    const body = await req.json();
    const { containerNumber, status } = body;

    const updatedContainer = await Container.findOneAndUpdate(
      { containerNumber },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedContainer) {
      return NextResponse.json({ success: false, message: 'Container not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedContainer });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'An unknown error occurred' }, { status: 400 });
  }
}