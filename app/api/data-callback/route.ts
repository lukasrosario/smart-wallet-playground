type RequestedInfo = {
  email?: string;
  phoneNumber?: {
    number: string;
    country: string;
    isPrimary: boolean;
  };
  physicalAddress?: {
    physicalAddress: {
      address1: string;
      address2?: string;
      city: string;
      state: string;
      postalCode: string;
      countryCode: string;
      name?: {
        firstName: string;
        familyName: string;
      };
    };
    isPrimary: boolean;
  };
  name?: {
    firstName: string;
    familyName: string;
  };
  onchainAddress?: string;
};

type CallbackRequest = {
  calls: {
    to: string;
    data: string;
  }[];
  chainId: string;
  version: string;
  capabilities: {
    dataCallback: {
      requestedInfo: RequestedInfo;
    };
  };
};

type ErrorResponse = {
  errors: {
    email?: string;
    phoneNumber?: {
      number?: string;
      country?: string;
    };
    physicalAddress?: {
      address1?: string;
      address2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      countryCode?: string;
    };
    name?: {
      firstName?: string;
      familyName?: string;
    };
    onchainAddress?: string;
    server?: string; // For server errors
  };
};

type SuccessResponse = {
  calls: {
    to: string;
    data: string;
  }[];
  chainId: string;
  version: string;
  capabilities: {
    dataCallback: Record<string, unknown>;
    [key: string]: unknown;
  };
};

export async function POST(request: Request): Promise<Response> {
  try {
    const requestData: CallbackRequest = await request.json();

    // Extract requested info from the structure
    const { requestedInfo } = requestData.capabilities.dataCallback;

    if (!requestedInfo) {
      // Return success with original data if no requestedInfo
      const response: SuccessResponse = {
        calls: requestData.calls,
        chainId: requestData.chainId,
        version: requestData.version,
        capabilities: requestData.capabilities,
      };
      return Response.json(response);
    }

    const errors: ErrorResponse['errors'] = {};

    // Validate email
    if (requestedInfo.email && requestedInfo.email.endsWith('@example.com')) {
      errors.email = 'Example.com emails are not allowed';
    }

    // Validate physical address
    if (requestedInfo.physicalAddress) {
      const addr = requestedInfo.physicalAddress.physicalAddress;
      if (addr.postalCode && addr.postalCode.length < 5) {
        if (!errors.physicalAddress) errors.physicalAddress = {};
        errors.physicalAddress.postalCode = 'Invalid postal code';
      }
    }

    // Validate name
    if (requestedInfo.name) {
      if (requestedInfo.name.firstName && requestedInfo.name.firstName.length < 2) {
        if (!errors.name) errors.name = {};
        errors.name.firstName = 'First name too short';
      }
    }

    // Validate phone number
    if (requestedInfo.phoneNumber) {
      if (requestedInfo.phoneNumber.number && requestedInfo.phoneNumber.number.length < 10) {
        if (!errors.phoneNumber) errors.phoneNumber = {};
        errors.phoneNumber.number = 'Invalid phone number';
      }
    }

    // Return errors if any found
    if (Object.keys(errors).length > 0) {
      const errorResponse: ErrorResponse = { errors };
      return Response.json(errorResponse);
    }

    // Success - return original calls (must include dataCallback capability)
    const successResponse: SuccessResponse = {
      calls: requestData.calls,
      chainId: requestData.chainId,
      version: requestData.version,
      capabilities: requestData.capabilities,
    };

    return Response.json(successResponse);
  } catch {
    const errorResponse: ErrorResponse = {
      errors: { server: 'Server error validating data' },
    };
    return Response.json(errorResponse);
  }
}

// Health check endpoint
export async function GET(): Promise<Response> {
  return Response.json({
    message: 'Data callback endpoint is active',
    timestamp: new Date().toISOString(),
    status: 'healthy',
  });
}
