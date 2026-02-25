import { database, Contact } from './database';

export interface IdentifyRequest {
  email?: string;
  phoneNumber?: string;
}

export interface IdentifyResponse {
  contact: {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export async function identifyContact(req: IdentifyRequest): Promise<IdentifyResponse> {
  const { email, phoneNumber } = req;

  if (!email && !phoneNumber) {
    throw new Error('Either email or phoneNumber must be provided');
  }

  const matchingContacts = await database.findContacts(email, phoneNumber);

  if (matchingContacts.length === 0) {
    const newContact = await database.createContact(email || null, phoneNumber || null, null, 'primary');
    return buildResponse([newContact]);
  }

  let allContacts = await database.getAllLinkedContacts(matchingContacts.map(c => c.id));
  
  const primaryContacts = allContacts.filter(c => c.linkPrecedence === 'primary');
  
  if (primaryContacts.length > 1) {
    primaryContacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const oldestPrimary = primaryContacts[0];
    
    for (let i = 1; i < primaryContacts.length; i++) {
      await database.updateContact(primaryContacts[i].id, {
        linkedId: oldestPrimary.id,
        linkPrecedence: 'secondary'
      });
    }
    
    const secondariesToUpdate = allContacts.filter(
      c => c.linkPrecedence === 'secondary' && c.linkedId !== oldestPrimary.id
    );
    
    for (const contact of secondariesToUpdate) {
      await database.updateContact(contact.id, { linkedId: oldestPrimary.id });
    }
    
    allContacts = await database.getAllLinkedContacts([oldestPrimary.id]);
  }

  const primary = allContacts.find(c => c.linkPrecedence === 'primary')!;
  
  const hasEmail = allContacts.some(c => c.email === email);
  const hasPhone = allContacts.some(c => c.phoneNumber === phoneNumber);
  
  if ((email && !hasEmail) || (phoneNumber && !hasPhone)) {
    const newContact = await database.createContact(
      email && !hasEmail ? email : null,
      phoneNumber && !hasPhone ? phoneNumber : null,
      primary.id,
      'secondary'
    );
    allContacts.push(newContact);
  }

  return buildResponse(allContacts);
}

function buildResponse(contacts: Contact[]): IdentifyResponse {
  const primary = contacts.find(c => c.linkPrecedence === 'primary')!;
  const secondaries = contacts.filter(c => c.linkPrecedence === 'secondary');

  const emails = [...new Set(contacts.map(c => c.email).filter(Boolean) as string[])];
  const phoneNumbers = [...new Set(contacts.map(c => c.phoneNumber).filter(Boolean) as string[])];

  const primaryEmail = primary.email;
  const primaryPhone = primary.phoneNumber;
  
  if (primaryEmail) {
    emails.splice(emails.indexOf(primaryEmail), 1);
    emails.unshift(primaryEmail);
  }
  if (primaryPhone) {
    phoneNumbers.splice(phoneNumbers.indexOf(primaryPhone), 1);
    phoneNumbers.unshift(primaryPhone);
  }

  return {
    contact: {
      primaryContactId: primary.id,
      emails,
      phoneNumbers,
      secondaryContactIds: secondaries.map(c => c.id)
    }
  };
}
