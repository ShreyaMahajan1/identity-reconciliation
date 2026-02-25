import sqlite3 from 'sqlite3';
import { promisify } from 'util';

export interface Contact {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: 'primary' | 'secondary';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(':memory:');
  }

  async initialize(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    await run(`
      CREATE TABLE Contact (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phoneNumber TEXT,
        email TEXT,
        linkedId INTEGER,
        linkPrecedence TEXT CHECK(linkPrecedence IN ('primary', 'secondary')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        deletedAt DATETIME,
        FOREIGN KEY (linkedId) REFERENCES Contact(id)
      )
    `);
  }

  async findContacts(email?: string, phoneNumber?: string): Promise<Contact[]> {
    return new Promise((resolve, reject) => {
      const conditions: string[] = [];
      const params: any[] = [];

      if (email) {
        conditions.push('email = ?');
        params.push(email);
      }
      if (phoneNumber) {
        conditions.push('phoneNumber = ?');
        params.push(phoneNumber);
      }

      const query = `SELECT * FROM Contact WHERE deletedAt IS NULL AND (${conditions.join(' OR ')})`;
      
      this.db.all(query, params, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows.map(this.mapRow));
      });
    });
  }

  async getAllLinkedContacts(contactIds: number[]): Promise<Contact[]> {
    if (contactIds.length === 0) return [];
    
    return new Promise((resolve, reject) => {
      const placeholders = contactIds.map(() => '?').join(',');
      const query = `
        SELECT * FROM Contact 
        WHERE deletedAt IS NULL AND (
          id IN (${placeholders}) OR 
          linkedId IN (${placeholders})
        )
      `;
      
      this.db.all(query, [...contactIds, ...contactIds], (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows.map(this.mapRow));
      });
    });
  }

  async createContact(
    email: string | null,
    phoneNumber: string | null,
    linkedId: number | null,
    linkPrecedence: 'primary' | 'secondary'
  ): Promise<Contact> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence)
        VALUES (?, ?, ?, ?)
      `;
      
      this.db.run(query, [email, phoneNumber, linkedId, linkPrecedence], function(err) {
        if (err) reject(err);
        else {
          database.getContactById(this.lastID).then(resolve).catch(reject);
        }
      });
    });
  }

  async updateContact(id: number, updates: Partial<Contact>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.linkedId !== undefined) {
      fields.push('linkedId = ?');
      params.push(updates.linkedId);
    }
    if (updates.linkPrecedence !== undefined) {
      fields.push('linkPrecedence = ?');
      params.push(updates.linkPrecedence);
    }

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(id);

    return new Promise((resolve, reject) => {
      const query = `UPDATE Contact SET ${fields.join(', ')} WHERE id = ?`;
      this.db.run(query, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getContactById(id: number): Promise<Contact> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM Contact WHERE id = ?', [id], (err, row: any) => {
        if (err) reject(err);
        else resolve(this.mapRow(row));
      });
    });
  }

  private mapRow(row: any): Contact {
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null
    };
  }
}

export const database = new Database();
