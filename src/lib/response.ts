import { NextResponse } from 'next/server'

type ResponseData = {
  data?: any
  message: string
  success: boolean
  statusCode: number
}

export const successResponse = (message: string = 'Success', data: any = null, statusCode: number = 200) => {
  const responseData: ResponseData = {
    data,
    message,
    success: true,
    statusCode
  }

  return NextResponse.json({ data: responseData }, { 
    status: statusCode,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export const errorResponse = (message: string = 'Something went wrong', data: any = null, statusCode: number = 500) => {
  const responseData: ResponseData = {
    data,
    message,
    success: false,
    statusCode
  }

  return NextResponse.json({ data: responseData }, { 
    status: statusCode,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
