import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";


export async function GET(request: NextRequest) {
  try {
    console.log("ello")
    const auth = await currentUser();
    
  
    if (!auth) {
      return NextResponse.json({isSynced:false})
    }
    
    const user = await prisma.user.findUnique({
      where:{
        externalId:auth.id
      }
    });

    console.log("user is",user)
  
    if(!user){
      console.log("hello man")
      let fullName = auth.fullName || `${auth.firstName} ${auth.lastName}`;
      await prisma.user.create({
        data:{
          externalId:auth.id,
          email:auth.emailAddresses[0].emailAddress,
          fullName,
          imageUrl:auth.imageUrl || ""
        }
      })
      return NextResponse.json({isSynced:true})
    }
    return NextResponse.json({isSynced:true})
  } catch (error) {
    return NextResponse.json({isSynced:false})
  }
}
