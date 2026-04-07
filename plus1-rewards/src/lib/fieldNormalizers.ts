/**
 * Utility functions to normalize field access across tables
 * 
 * STANDARDIZED SCHEMA:
 * - Phone: call_phone (all tables)
 * - Names: first_name, last_name (all tables) + shop_name (partners) + provider_name (insurers)
 * - IDs: sa_id (all tables)
 * - Address: address_line_1 (members, partners)
 * 
 * MIGRATION IN PROGRESS - Some tables still use old field names:
 * - Deprecated: cell_phone, mobile_number, phone, id_number, license_number, address
 */

/**
 * Get phone number from any entity (member, partner, agent, driver, insurer)
 * Uses standardized field: call_phone
 * Falls back to deprecated fields during migration
 */
export const getPhoneNumber = (entity: any): string => {
  if (!entity) return '';
  
  // Try standardized field first, then deprecated fields
  return (
    entity.call_phone ||      // standardized
    entity.cell_phone ||      // deprecated (members)
    entity.mobile_number ||   // deprecated (agents, drivers, insurers, partners)
    entity.phone ||           // deprecated (drivers, insurers, partners)
    ''
  );
};

/**
 * Get person's full name (first + last name)
 */
export const getPersonName = (entity: any): string => {
  if (!entity) return 'Unknown';
  
  if (entity.first_name || entity.last_name) {
    const firstName = entity.first_name || '';
    const lastName = entity.last_name || '';
    const combined = `${firstName} ${lastName}`.trim();
    if (combined) return combined;
  }
  
  return 'Unknown';
};

/**
 * Get full name from any entity (person name or business name)
 * Handles: first_name + last_name, full_name, responsible_person, shop_name, provider_name
 */
export const getFullName = (entity: any): string => {
  if (!entity) return 'Unknown';
  
  // Try first_name + last_name combination first
  const personName = getPersonName(entity);
  if (personName !== 'Unknown') return personName;
  
  // Fallback to business/legacy name fields
  return (
    entity.full_name ||
    entity.responsible_person ||
    entity.shop_name ||
    entity.provider_name ||
    'Unknown'
  );
};

/**
 * Get business name from partner or insurer
 */
export const getBusinessName = (entity: any): string => {
  return entity?.shop_name || entity?.provider_name || '';
};

/**
 * Get email from any entity
 */
export const getEmail = (entity: any): string => {
  return entity?.email || '';
};

/**
 * Get ID number from any entity
 * Uses standardized field: sa_id
 * Falls back to deprecated fields during migration
 */
export const getIdNumber = (entity: any): string => {
  return (
    entity?.sa_id ||          // standardized
    entity?.id_number ||      // deprecated (agents)
    entity?.license_number || // deprecated (drivers)
    ''
  );
};

/**
 * Get address from any entity
 * Uses standardized field: address_line_1
 * Falls back to deprecated field during migration
 */
export const getAddress = (entity: any): string => {
  return (
    entity?.address_line_1 || // standardized
    entity?.address ||        // deprecated (partners)
    ''
  );
};

/**
 * Get postal code from any entity
 */
export const getPostalCode = (entity: any): string => {
  return entity?.postal_code || '';
};

/**
 * Get location coordinates from any entity
 */
export const getLocation = (entity: any): { latitude: number | null; longitude: number | null } => {
  return {
    latitude: entity?.latitude ? parseFloat(entity.latitude) : null,
    longitude: entity?.longitude ? parseFloat(entity.longitude) : null
  };
};

/**
 * Normalize entity data for consistent access
 * Returns object with standardized field names
 */
export const normalizeEntity = (entity: any, type: 'member' | 'partner' | 'agent' | 'driver' | 'insurer') => {
  if (!entity) return null;
  
  const normalized: any = {
    id: entity.id,
    type,
    firstName: entity.first_name || '',
    lastName: entity.last_name || '',
    personName: getPersonName(entity),
    fullName: getFullName(entity),
    phone: getPhoneNumber(entity),
    email: getEmail(entity),
    idNumber: getIdNumber(entity),
    address: getAddress(entity),
    postalCode: getPostalCode(entity),
    location: getLocation(entity),
  };
  
  // Add business name for partners and insurers
  if (type === 'partner' || type === 'insurer') {
    normalized.businessName = getBusinessName(entity);
  }
  
  // Preserve original data
  return { ...normalized, ...entity };
};
