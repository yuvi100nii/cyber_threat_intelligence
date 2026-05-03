-- =====================================================
-- CRMS: Add / Refresh Sample Data with Full Linkages
-- Run this in MySQL after the schema is already set up
-- =====================================================
USE crms_db;

-- Disable FK checks so we can clean tables safely
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM case_updates;
DELETE FROM evidence;
DELETE FROM case_assignments;
DELETE FROM crime_victims;
DELETE FROM crime_criminals;
DELETE FROM fir;
DELETE FROM victims;
DELETE FROM crimes;
DELETE FROM criminals;
SET FOREIGN_KEY_CHECKS = 1;

-- ─── CRIMINALS ───────────────────────────────────────
INSERT INTO criminals
  (first_name, last_name, alias, date_of_birth, gender, nationality, address, phone,
   identification_mark, status, height_cm, weight_kg, eye_color, hair_color)
VALUES
  ('James',  'Wilson', 'The Shadow', '1985-06-15', 'male',   'American', '123 Dark Alley, Downtown',    '555-9001', 'Scar on left cheek',   'wanted',   180, 75,  'brown', 'black'),
  ('Maria',  'Garcia', 'Red Fox',    '1990-02-28', 'female', 'Mexican',  '456 Hidden Street, Westside', '555-9002', 'Tattoo on right arm',  'arrested', 165, 55,  'green', 'red'),
  ('Robert', 'Brown',  'Big Bob',    '1978-11-03', 'male',   'American', '789 Crime Lane, Eastside',    NULL,       'Missing left pinky',   'wanted',   195, 110, 'blue',  'bald'),
  ('Lisa',   'Chen',   NULL,         '1995-08-22', 'female', 'Chinese',  '321 Quiet Road, Suburbs',     '555-9004', 'None',                 'released', 158, 50,  'brown', 'black'),
  ('Ahmed',  'Hassan', 'The Ghost',  '1982-04-10', 'male',   'Egyptian', 'Unknown',                     NULL,       'Burn mark on back',    'wanted',   175, 70,  'brown', 'brown'),
  ('Rahul',  'Sharma', 'Raju',       '1988-09-01', 'male',   'Indian',   '10 Gandhi Nagar, Delhi',      '555-9006', 'Tattoo on neck',       'arrested', 170, 72,  'brown', 'black'),
  ('Priya',  'Mehta',  'PM',         '1993-03-15', 'female', 'Indian',   '22 Rose Garden, Mumbai',      '555-9007', 'Mole on left cheek',   'wanted',   162, 56,  'brown', 'black');

-- ─── CRIMES ──────────────────────────────────────────
INSERT INTO crimes
  (crime_number, crime_type, title, description, date_occurred, time_occurred,
   location, city, state, status, severity, weapon_used, created_by)
VALUES
  ('CR-2024-001', 'robbery',           'Downtown Bank Robbery',          'Armed robbery at First National Bank. Suspects escaped with approximately Rs. 50 Lakh.',  '2024-01-15', '14:30:00', '100 Main Street',               'Metro City',  'State A', 'investigating', 'high',     'Handgun', 1),
  ('CR-2024-002', 'murder',            'Warehouse District Homicide',    'Body found in abandoned warehouse. Victim identified as local businessman.',              '2024-01-20', '23:45:00', '500 Industrial Ave',            'Metro City',  'State A', 'open',          'critical', 'Knife',   1),
  ('CR-2024-003', 'cybercrime',        'Corporate Data Breach',          'Major data breach affecting TechCorp. Customer data compromised.',                        '2024-02-01', '09:00:00', 'TechCorp HQ, 200 Silicon Blvd', 'Tech Valley', 'State B', 'investigating', 'high',     NULL,      1),
  ('CR-2024-004', 'drug_offense',      'Drug Trafficking Ring Bust',     'Large-scale drug operation discovered in residential area. 5kg seized.',                  '2024-02-10', '02:00:00', '777 Suburban Drive',            'Quiet Town',  'State A', 'solved',        'high',     NULL,      1),
  ('CR-2024-005', 'assault',           'Bar Fight Assault',              'Aggravated assault at local bar resulting in serious injuries.',                          '2024-02-14', '22:15:00', 'Joe''s Bar, 50 Party Street',   'Metro City',  'State A', 'closed',        'medium',   'Bottle',  1),
  ('CR-2024-006', 'theft',             'Vehicle Theft Ring',             'Multiple luxury vehicles stolen from dealership overnight.',                               '2024-02-20', '03:30:00', 'Luxury Auto Mall',              'Metro City',  'State A', 'open',          'medium',   NULL,      1),
  ('CR-2024-007', 'fraud',             'Insurance Fraud Scheme',         'Organised insurance fraud affecting multiple victims across the city.',                   '2024-03-01', '10:00:00', 'Various Locations',             'Metro City',  'State A', 'investigating', 'medium',   NULL,      1),
  ('CR-2024-008', 'kidnapping',        'Child Abduction Case',           'Missing child reported from school premises. CCTV under review.',                         '2024-03-05', '15:30:00', 'Lincoln Elementary School',     'Quiet Town',  'State A', 'investigating', 'critical', NULL,      1),
  ('CR-2024-009', 'domestic_violence', 'Domestic Violence Incident',     'Repeated domestic violence reported by neighbour. Victim hospitalised.',                  '2024-03-12', '20:00:00', '55 Sunrise Colony',             'Delhi',       'State C', 'investigating', 'high',     NULL,      1),
  ('CR-2024-010', 'fraud',             'Online Banking Fraud',           'Victim lost Rs. 2 Lakh via phishing attack orchestrated by suspect.',                     '2024-04-01', '11:00:00', 'Cyber Cell Online',             'Mumbai',      'State D', 'open',          'medium',   NULL,      1);

-- ─── VICTIMS ─────────────────────────────────────────
INSERT INTO victims
  (first_name, last_name, date_of_birth, gender, address, phone, email, occupation, injury_description, statement)
VALUES
  ('Michael', 'Thompson', '1970-05-20', 'male',   '100 Main Street, Metro City',   '555-1001', 'mthompson@email.com',    'Bank Manager',       'Minor injuries from being pushed',    'I was at the counter when three masked men entered...'),
  ('David',   'Lee',      '1965-09-12', 'male',   '45 Business Park, Metro City',  '555-1002', 'david.lee@techcorp.com', 'Businessman',        'Fatal stab wounds',                   NULL),
  ('TechCorp','Inc.',      NULL,         NULL,     '200 Silicon Blvd, Tech Valley', '555-1003', 'security@techcorp.com',  'Technology Company', 'Data breach - financial losses',       'We noticed unusual activity on our servers...'),
  ('Emily',   'Watson',   '1988-12-03', 'female', '60 Park Avenue, Metro City',    '555-1004', 'emily.w@email.com',      'Teacher',            'Bruises and lacerations',             'I was trying to break up the fight when...'),
  ('Jake',    'Miller',   '2015-07-15', 'male',   '150 Oak Street, Quiet Town',    '555-1005', NULL,                     'Student',            'Unknown',                             NULL),
  ('Sunita',  'Rao',      '1985-06-10', 'female', '55 Sunrise Colony, Delhi',      '555-1006', 'sunita.rao@email.com',   'Homemaker',          'Multiple bruises and fractures',       'My husband has been hitting me for years...'),
  ('Amit',    'Kapoor',   '1979-11-22', 'male',   '30 Bank Road, Mumbai',          '555-1007', 'amit.k@email.com',       'Software Engineer',  'Financial loss of Rs. 2 Lakh',        'I received a call asking for my OTP...');

-- ─── FIRs (using subquery to get crime_id by crime_number) ───────────────────
INSERT INTO fir
  (fir_number, crime_id, complainant_name, complainant_address, complainant_phone,
   date_filed, time_filed, description, status, investigating_officer_id)
VALUES
  ('FIR-2024-001', (SELECT id FROM crimes WHERE crime_number='CR-2024-001'), 'First National Bank Security', '100 Main Street, Metro City',    '555-2001', '2024-01-15', '15:00:00', 'Armed robbery - three suspects, getaway car seen fleeing northbound.',        'under_investigation', 1),
  ('FIR-2024-002', (SELECT id FROM crimes WHERE crime_number='CR-2024-002'), 'Anonymous Caller',             'Unknown',                         NULL,       '2024-01-21', '00:30:00', 'Body discovered in warehouse. Identified as David Lee, local businessman.',   'under_investigation', 1),
  ('FIR-2024-003', (SELECT id FROM crimes WHERE crime_number='CR-2024-003'), 'TechCorp Security Team',       '200 Silicon Blvd, Tech Valley',   '555-2003', '2024-02-01', '11:00:00', 'Unauthorized access detected. Customer PII (personal data) leaked.',          'under_investigation', 1),
  ('FIR-2024-004', (SELECT id FROM crimes WHERE crime_number='CR-2024-004'), 'Neighbourhood Watch',          '777 Suburban Drive, Quiet Town',  '555-2004', '2024-02-10', '03:00:00', 'Suspicious vehicles reported. 5kg narcotics found in basement of property.',  'chargesheet_filed',   1),
  ('FIR-2024-005', (SELECT id FROM crimes WHERE crime_number='CR-2024-008'), 'Sarah Miller',                 '150 Oak Street, Quiet Town',      '555-2005', '2024-03-05', '16:00:00', 'Child did not return from school. Last seen boarding an unknown car at 3:30PM.','under_investigation', 1),
  ('FIR-2024-006', (SELECT id FROM crimes WHERE crime_number='CR-2024-009'), 'Neighbour Rakesh Gupta',       '56 Sunrise Colony, Delhi',        '555-2006', '2024-03-12', '21:00:00', 'Heard screaming from neighbour. Victim found with injuries. Ambulance called.','registered',          1),
  ('FIR-2024-007', (SELECT id FROM crimes WHERE crime_number='CR-2024-010'), 'Amit Kapoor',                  '30 Bank Road, Mumbai',            '555-2007', '2024-04-01', '12:00:00', 'Victim tricked via phone call into sharing OTP. Rs. 2 Lakh debited.',         'registered',          1);

-- ─── LINK CRIMINALS TO CRIMES ────────────────────────
INSERT INTO crime_criminals (crime_id, criminal_id, role, notes)
SELECT c.id, cr.id, 'primary', 'Identified from security footage - wearing red cap'
FROM crimes c, criminals cr WHERE c.crime_number='CR-2024-001' AND cr.first_name='James' AND cr.last_name='Wilson';

INSERT INTO crime_criminals (crime_id, criminal_id, role, notes)
SELECT c.id, cr.id, 'accomplice', 'Getaway driver - large build matches Big Bob'
FROM crimes c, criminals cr WHERE c.crime_number='CR-2024-001' AND cr.first_name='Robert' AND cr.last_name='Brown';

INSERT INTO crime_criminals (crime_id, criminal_id, role, notes)
SELECT c.id, cr.id, 'suspect', 'Witness saw someone matching Ahmed Hassan near warehouse'
FROM crimes c, criminals cr WHERE c.crime_number='CR-2024-002' AND cr.first_name='Ahmed' AND cr.last_name='Hassan';

INSERT INTO crime_criminals (crime_id, criminal_id, role, notes)
SELECT c.id, cr.id, 'primary', 'Maria Garcia arrested at scene with drugs'
FROM crimes c, criminals cr WHERE c.crime_number='CR-2024-004' AND cr.first_name='Maria' AND cr.last_name='Garcia';

INSERT INTO crime_criminals (crime_id, criminal_id, role, notes)
SELECT c.id, cr.id, 'accomplice', 'Lisa Chen released after full cooperation with police'
FROM crimes c, criminals cr WHERE c.crime_number='CR-2024-004' AND cr.first_name='Lisa' AND cr.last_name='Chen';

INSERT INTO crime_criminals (crime_id, criminal_id, role, notes)
SELECT c.id, cr.id, 'suspect', 'James Wilson suspected in vehicle theft ring'
FROM crimes c, criminals cr WHERE c.crime_number='CR-2024-006' AND cr.first_name='James' AND cr.last_name='Wilson';

INSERT INTO crime_criminals (crime_id, criminal_id, role, notes)
SELECT c.id, cr.id, 'accomplice', 'Robert Brown linked via fingerprint on vehicle'
FROM crimes c, criminals cr WHERE c.crime_number='CR-2024-006' AND cr.first_name='Robert' AND cr.last_name='Brown';

INSERT INTO crime_criminals (crime_id, criminal_id, role, notes)
SELECT c.id, cr.id, 'primary', 'Lisa Chen identified as ringleader of fraud scheme'
FROM crimes c, criminals cr WHERE c.crime_number='CR-2024-007' AND cr.first_name='Lisa' AND cr.last_name='Chen';

INSERT INTO crime_criminals (crime_id, criminal_id, role, notes)
SELECT c.id, cr.id, 'accomplice', 'Priya Mehta posing as insurance officer'
FROM crimes c, criminals cr WHERE c.crime_number='CR-2024-007' AND cr.first_name='Priya' AND cr.last_name='Mehta';

INSERT INTO crime_criminals (crime_id, criminal_id, role, notes)
SELECT c.id, cr.id, 'primary', 'Rahul Sharma - domestic violence accused'
FROM crimes c, criminals cr WHERE c.crime_number='CR-2024-009' AND cr.first_name='Rahul' AND cr.last_name='Sharma';

INSERT INTO crime_criminals (crime_id, criminal_id, role, notes)
SELECT c.id, cr.id, 'primary', 'Priya Mehta - conducted phishing calls'
FROM crimes c, criminals cr WHERE c.crime_number='CR-2024-010' AND cr.first_name='Priya' AND cr.last_name='Mehta';

INSERT INTO crime_criminals (crime_id, criminal_id, role, notes)
SELECT c.id, cr.id, 'accomplice', 'Rahul Sharma - mule account used for transfers'
FROM crimes c, criminals cr WHERE c.crime_number='CR-2024-010' AND cr.first_name='Rahul' AND cr.last_name='Sharma';

-- ─── LINK VICTIMS TO CRIMES ──────────────────────────
INSERT INTO crime_victims (crime_id, victim_id, notes)
SELECT c.id, v.id, 'Bank manager assaulted during robbery'
FROM crimes c, victims v WHERE c.crime_number='CR-2024-001' AND v.first_name='Michael' AND v.last_name='Thompson';

INSERT INTO crime_victims (crime_id, victim_id, notes)
SELECT c.id, v.id, 'Deceased victim - David Lee'
FROM crimes c, victims v WHERE c.crime_number='CR-2024-002' AND v.first_name='David' AND v.last_name='Lee';

INSERT INTO crime_victims (crime_id, victim_id, notes)
SELECT c.id, v.id, 'TechCorp Inc. - corporate victim'
FROM crimes c, victims v WHERE c.crime_number='CR-2024-003' AND v.first_name='TechCorp';

INSERT INTO crime_victims (crime_id, victim_id, notes)
SELECT c.id, v.id, 'Emily Watson - injured bystander'
FROM crimes c, victims v WHERE c.crime_number='CR-2024-005' AND v.first_name='Emily' AND v.last_name='Watson';

INSERT INTO crime_victims (crime_id, victim_id, notes)
SELECT c.id, v.id, 'Jake Miller - missing child'
FROM crimes c, victims v WHERE c.crime_number='CR-2024-008' AND v.first_name='Jake' AND v.last_name='Miller';

INSERT INTO crime_victims (crime_id, victim_id, notes)
SELECT c.id, v.id, 'Sunita Rao - domestic violence victim'
FROM crimes c, victims v WHERE c.crime_number='CR-2024-009' AND v.first_name='Sunita' AND v.last_name='Rao';

INSERT INTO crime_victims (crime_id, victim_id, notes)
SELECT c.id, v.id, 'Amit Kapoor - online fraud victim'
FROM crimes c, victims v WHERE c.crime_number='CR-2024-010' AND v.first_name='Amit' AND v.last_name='Kapoor';

-- ─── CASE ASSIGNMENTS ────────────────────────────────
INSERT INTO case_assignments (crime_id, officer_id, assigned_date, role, status, notes)
SELECT id, 1, '2024-01-15', 'lead', 'active',    'Primary investigator' FROM crimes WHERE crime_number='CR-2024-001';
INSERT INTO case_assignments (crime_id, officer_id, assigned_date, role, status, notes)
SELECT id, 1, '2024-01-21', 'lead', 'active',    'Homicide investigation lead' FROM crimes WHERE crime_number='CR-2024-002';
INSERT INTO case_assignments (crime_id, officer_id, assigned_date, role, status, notes)
SELECT id, 1, '2024-02-01', 'lead', 'active',    'Cyber forensics assigned' FROM crimes WHERE crime_number='CR-2024-003';
INSERT INTO case_assignments (crime_id, officer_id, assigned_date, role, status, notes)
SELECT id, 1, '2024-02-10', 'lead', 'completed', 'Case resolved - arrests made' FROM crimes WHERE crime_number='CR-2024-004';
INSERT INTO case_assignments (crime_id, officer_id, assigned_date, role, status, notes)
SELECT id, 1, '2024-03-05', 'lead', 'active',    'Urgent - child abduction' FROM crimes WHERE crime_number='CR-2024-008';
INSERT INTO case_assignments (crime_id, officer_id, assigned_date, role, status, notes)
SELECT id, 1, '2024-03-12', 'lead', 'active',    'DV case - victim needs protection' FROM crimes WHERE crime_number='CR-2024-009';
INSERT INTO case_assignments (crime_id, officer_id, assigned_date, role, status, notes)
SELECT id, 1, '2024-04-01', 'investigator', 'active', 'Tracing phishing origin' FROM crimes WHERE crime_number='CR-2024-010';

-- ─── CASE UPDATES ────────────────────────────────────
INSERT INTO case_updates (crime_id, officer_id, update_type, description)
SELECT id, 1, 'evidence', 'Security footage recovered from bank cameras' FROM crimes WHERE crime_number='CR-2024-001';
INSERT INTO case_updates (crime_id, officer_id, update_type, description)
SELECT id, 1, 'witness',  'Three witnesses interviewed - consistent descriptions' FROM crimes WHERE crime_number='CR-2024-001';
INSERT INTO case_updates (crime_id, officer_id, update_type, description)
SELECT id, 1, 'evidence', 'Murder weapon (knife) recovered at scene' FROM crimes WHERE crime_number='CR-2024-002';
INSERT INTO case_updates (crime_id, officer_id, update_type, description)
SELECT id, 1, 'note',     'Awaiting forensic analysis results' FROM crimes WHERE crime_number='CR-2024-002';
INSERT INTO case_updates (crime_id, officer_id, update_type, description)
SELECT id, 1, 'evidence', 'Server access logs obtained for analysis' FROM crimes WHERE crime_number='CR-2024-003';
INSERT INTO case_updates (crime_id, officer_id, update_type, description)
SELECT id, 1, 'arrest',   'Maria Garcia arrested. 5kg narcotics seized' FROM crimes WHERE crime_number='CR-2024-004';
INSERT INTO case_updates (crime_id, officer_id, update_type, description)
SELECT id, 1, 'note',     'CCTV footage from school being analysed' FROM crimes WHERE crime_number='CR-2024-008';
INSERT INTO case_updates (crime_id, officer_id, update_type, description)
SELECT id, 1, 'arrest',   'Rahul Sharma arrested based on victim statement' FROM crimes WHERE crime_number='CR-2024-009';
INSERT INTO case_updates (crime_id, officer_id, update_type, description)
SELECT id, 1, 'evidence', 'Bank transaction logs and call records obtained' FROM crimes WHERE crime_number='CR-2024-010';

-- ─── EVIDENCE ────────────────────────────────────────
INSERT INTO evidence (crime_id, evidence_type, description, location_found, collected_by, collection_date, storage_location)
SELECT id, 'Video',      'Security camera footage showing robbery',    'Bank lobby',          1, '2024-01-15', 'Evidence Room A' FROM crimes WHERE crime_number='CR-2024-001';
INSERT INTO evidence (crime_id, evidence_type, description, location_found, collected_by, collection_date, storage_location)
SELECT id, 'Physical',   'Abandoned mask found in alley',              'Alley behind bank',   1, '2024-01-15', 'Evidence Room A' FROM crimes WHERE crime_number='CR-2024-001';
INSERT INTO evidence (crime_id, evidence_type, description, location_found, collected_by, collection_date, storage_location)
SELECT id, 'Physical',   'Knife - possible murder weapon',             'Warehouse floor',     1, '2024-01-21', 'Evidence Room B' FROM crimes WHERE crime_number='CR-2024-002';
INSERT INTO evidence (crime_id, evidence_type, description, location_found, collected_by, collection_date, storage_location)
SELECT id, 'Biological', 'Blood and DNA samples',                      'Crime scene',         1, '2024-01-21', 'Forensic Lab'    FROM crimes WHERE crime_number='CR-2024-002';
INSERT INTO evidence (crime_id, evidence_type, description, location_found, collected_by, collection_date, storage_location)
SELECT id, 'Digital',    'Server access logs',                         'TechCorp servers',    1, '2024-02-01', 'Digital Storage'  FROM crimes WHERE crime_number='CR-2024-003';
INSERT INTO evidence (crime_id, evidence_type, description, location_found, collected_by, collection_date, storage_location)
SELECT id, 'Physical',   '5 kg narcotics (heroin)',                    'Basement',            1, '2024-02-10', 'Evidence Room C' FROM crimes WHERE crime_number='CR-2024-004';
INSERT INTO evidence (crime_id, evidence_type, description, location_found, collected_by, collection_date, storage_location)
SELECT id, 'Medical',    'Medical report showing fractures',           'City Hospital',       1, '2024-03-12', 'Evidence Room D' FROM crimes WHERE crime_number='CR-2024-009';
INSERT INTO evidence (crime_id, evidence_type, description, location_found, collected_by, collection_date, storage_location)
SELECT id, 'Digital',    'Bank transaction logs and call recording',   'Cyber Cell server',   1, '2024-04-01', 'Digital Storage'  FROM crimes WHERE crime_number='CR-2024-010';

-- ─── VERIFY ──────────────────────────────────────────
SELECT 'Data loaded successfully!' AS status;
SELECT CONCAT('Criminals: ',            COUNT(*)) AS summary FROM criminals
UNION ALL SELECT CONCAT('Crimes: ',     COUNT(*))            FROM crimes
UNION ALL SELECT CONCAT('Victims: ',    COUNT(*))            FROM victims
UNION ALL SELECT CONCAT('FIRs: ',       COUNT(*))            FROM fir
UNION ALL SELECT CONCAT('Crim-Crime links: ', COUNT(*))      FROM crime_criminals
UNION ALL SELECT CONCAT('Victim-Crime links: ', COUNT(*))    FROM crime_victims;
