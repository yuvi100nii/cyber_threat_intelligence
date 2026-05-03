-- Sample Data for Crime Record Management System
USE crms_db;

-- Insert Admin User (Password: admin123 - hashed with bcrypt)
INSERT INTO users (username, password, full_name, email, role, badge_number, department, phone) VALUES
('admin', '$2b$10$rQZ7.Y8qT5K3K8q5vX9qXe8YJYzS5X5X5X5X5X5X5X5X5X5X5X5X5X', 'System Administrator', 'admin@crms.gov', 'admin', 'ADMIN001', 'Headquarters', '555-0100'),
('officer_john', '$2b$10$rQZ7.Y8qT5K3K8q5vX9qXe8YJYzS5X5X5X5X5X5X5X5X5X5X5X5X5X', 'John Smith', 'john.smith@crms.gov', 'police_officer', 'PO-1001', 'Homicide Division', '555-0101'),
('officer_jane', '$2b$10$rQZ7.Y8qT5K3K8q5vX9qXe8YJYzS5X5X5X5X5X5X5X5X5X5X5X5X5X', 'Jane Doe', 'jane.doe@crms.gov', 'police_officer', 'PO-1002', 'Cyber Crime Unit', '555-0102'),
('officer_mike', '$2b$10$rQZ7.Y8qT5K3K8q5vX9qXe8YJYzS5X5X5X5X5X5X5X5X5X5X5X5X5X', 'Mike Johnson', 'mike.johnson@crms.gov', 'police_officer', 'PO-1003', 'Narcotics Division', '555-0103'),
('officer_sarah', '$2b$10$rQZ7.Y8qT5K3K8q5vX9qXe8YJYzS5X5X5X5X5X5X5X5X5X5X5X5X5X', 'Sarah Williams', 'sarah.williams@crms.gov', 'police_officer', 'PO-1004', 'Traffic Division', '555-0104');

-- Insert Police Officer Details
INSERT INTO police_officers (user_id, rank, station, joining_date, specialization) VALUES
(2, 'Detective', 'Central Police Station', '2018-03-15', 'Homicide Investigation'),
(3, 'Sergeant', 'Cyber Crime Cell', '2019-07-20', 'Digital Forensics'),
(4, 'Inspector', 'Anti-Narcotics Bureau', '2015-01-10', 'Drug Trafficking'),
(5, 'Constable', 'Traffic Control', '2020-11-05', 'Accident Investigation');

-- Insert Criminals
INSERT INTO criminals (first_name, last_name, alias, date_of_birth, gender, nationality, address, phone, identification_mark, status, height_cm, weight_kg, eye_color, hair_color) VALUES
('James', 'Wilson', 'The Shadow', '1985-06-15', 'male', 'American', '123 Dark Alley, Downtown', '555-9001', 'Scar on left cheek', 'wanted', 180, 75, 'brown', 'black'),
('Maria', 'Garcia', 'Red Fox', '1990-02-28', 'female', 'Mexican', '456 Hidden Street, Westside', '555-9002', 'Tattoo on right arm', 'arrested', 165, 55, 'green', 'red'),
('Robert', 'Brown', 'Big Bob', '1978-11-03', 'male', 'American', '789 Crime Lane, Eastside', NULL, 'Missing left pinky', 'wanted', 195, 110, 'blue', 'bald'),
('Lisa', 'Chen', NULL, '1995-08-22', 'female', 'Chinese', '321 Quiet Road, Suburbs', '555-9004', 'None', 'released', 158, 50, 'brown', 'black'),
('Ahmed', 'Hassan', 'The Ghost', '1982-04-10', 'male', 'Egyptian', 'Unknown', NULL, 'Burn mark on back', 'wanted', 175, 70, 'brown', 'brown');

-- Insert Crimes
INSERT INTO crimes (crime_number, crime_type, title, description, date_occurred, time_occurred, location, city, state, status, severity, weapon_used, created_by) VALUES
('CR-2024-001', 'robbery', 'Downtown Bank Robbery', 'Armed robbery at First National Bank. Suspects escaped with approximately $50,000.', '2024-01-15', '14:30:00', '100 Main Street', 'Metro City', 'State A', 'investigating', 'high', 'Handgun', 2),
('CR-2024-002', 'murder', 'Warehouse District Homicide', 'Body found in abandoned warehouse. Victim identified as local businessman.', '2024-01-20', '23:45:00', '500 Industrial Ave', 'Metro City', 'State A', 'open', 'critical', 'Knife', 2),
('CR-2024-003', 'cybercrime', 'Corporate Data Breach', 'Major data breach affecting TechCorp. Customer data compromised.', '2024-02-01', '09:00:00', 'TechCorp HQ, 200 Silicon Blvd', 'Tech Valley', 'State B', 'investigating', 'high', NULL, 3),
('CR-2024-004', 'drug_offense', 'Drug Trafficking Ring Bust', 'Large-scale drug operation discovered in residential area.', '2024-02-10', '02:00:00', '777 Suburban Drive', 'Quiet Town', 'State A', 'solved', 'high', NULL, 4),
('CR-2024-005', 'assault', 'Bar Fight Assault', 'Aggravated assault at local bar resulting in serious injuries.', '2024-02-14', '22:15:00', 'Joe\'s Bar, 50 Party Street', 'Metro City', 'State A', 'closed', 'medium', 'Bottle', 2),
('CR-2024-006', 'theft', 'Vehicle Theft Ring', 'Multiple luxury vehicles stolen from dealership.', '2024-02-20', '03:30:00', 'Luxury Auto Mall', 'Metro City', 'State A', 'open', 'medium', NULL, 5),
('CR-2024-007', 'fraud', 'Insurance Fraud Scheme', 'Organized insurance fraud affecting multiple victims.', '2024-03-01', '10:00:00', 'Various Locations', 'Metro City', 'State A', 'investigating', 'medium', NULL, 2),
('CR-2024-008', 'kidnapping', 'Child Abduction Case', 'Missing child reported from school premises.', '2024-03-05', '15:30:00', 'Lincoln Elementary School', 'Quiet Town', 'State A', 'investigating', 'critical', NULL, 2);

-- Insert Victims
INSERT INTO victims (first_name, last_name, date_of_birth, gender, address, phone, email, occupation, injury_description, statement) VALUES
('Michael', 'Thompson', '1970-05-20', 'male', '100 Main Street, Metro City', '555-1001', 'mthompson@email.com', 'Bank Manager', 'Minor injuries from being pushed', 'I was at the counter when three masked men entered...'),
('David', 'Lee', '1965-09-12', 'male', '45 Business Park, Metro City', '555-1002', 'david.lee@techcorp.com', 'Businessman', 'Fatal stab wounds', NULL),
('TechCorp Inc.', 'Corporation', NULL, NULL, '200 Silicon Blvd, Tech Valley', '555-1003', 'security@techcorp.com', 'Technology Company', 'Data breach - financial losses', 'We noticed unusual activity on our servers...'),
('Emily', 'Watson', '1988-12-03', 'female', '60 Park Avenue, Metro City', '555-1004', 'emily.w@email.com', 'Teacher', 'Bruises and lacerations', 'I was trying to break up the fight when...'),
('Jake', 'Miller', '2015-07-15', 'male', '150 Oak Street, Quiet Town', '555-1005', NULL, 'Student', 'Unknown', NULL);

-- Insert FIRs
INSERT INTO fir (fir_number, crime_id, complainant_name, complainant_address, complainant_phone, date_filed, time_filed, description, status, investigating_officer_id) VALUES
('FIR-2024-001', 1, 'First National Bank Security', '100 Main Street, Metro City', '555-2001', '2024-01-15', '15:00:00', 'Report of armed robbery at bank premises. Three suspects involved.', 'under_investigation', 2),
('FIR-2024-002', 2, 'Anonymous Caller', 'Unknown', NULL, '2024-01-21', '00:30:00', 'Body discovered by homeless person in warehouse district.', 'under_investigation', 2),
('FIR-2024-003', 3, 'TechCorp Security Team', '200 Silicon Blvd, Tech Valley', '555-2003', '2024-02-01', '11:00:00', 'Major security breach detected. Customer data compromised.', 'under_investigation', 3),
('FIR-2024-004', 4, 'Neighborhood Watch', '777 Suburban Drive, Quiet Town', '555-2004', '2024-02-10', '03:00:00', 'Suspicious activity reported. Large quantities of drugs found.', 'chargesheet_filed', 4),
('FIR-2024-005', 8, 'Sarah Miller', '150 Oak Street, Quiet Town', '555-2005', '2024-03-05', '16:00:00', 'Child did not return from school. Last seen at 3:30 PM.', 'under_investigation', 2);

-- Link Criminals to Crimes
INSERT INTO crime_criminals (crime_id, criminal_id, role, notes) VALUES
(1, 1, 'primary', 'Identified from security footage'),
(1, 3, 'accomplice', 'Getaway driver'),
(2, 5, 'suspect', 'Witness saw someone matching description'),
(4, 2, 'primary', 'Arrested at scene'),
(4, 4, 'accomplice', 'Released after cooperation');

-- Link Victims to Crimes
INSERT INTO crime_victims (crime_id, victim_id, notes) VALUES
(1, 1, 'Bank manager present during robbery'),
(2, 2, 'Deceased victim'),
(3, 3, 'Corporate victim - data breach'),
(5, 4, 'Injured bystander'),
(8, 5, 'Missing child');

-- Assign Officers to Cases
INSERT INTO case_assignments (crime_id, officer_id, assigned_date, role, status, notes) VALUES
(1, 2, '2024-01-15', 'lead', 'active', 'Primary investigator for bank robbery'),
(1, 5, '2024-01-16', 'support', 'active', 'Assisting with vehicle tracking'),
(2, 2, '2024-01-21', 'lead', 'active', 'Homicide investigation lead'),
(3, 3, '2024-02-01', 'lead', 'active', 'Cyber forensics expert assigned'),
(4, 4, '2024-02-10', 'lead', 'completed', 'Case resolved - arrests made'),
(8, 2, '2024-03-05', 'lead', 'active', 'Urgent - child abduction case');

-- Add Case Updates
INSERT INTO case_updates (crime_id, officer_id, update_type, description) VALUES
(1, 2, 'evidence', 'Security footage recovered from bank cameras'),
(1, 2, 'witness', 'Three witnesses interviewed'),
(1, 5, 'note', 'Possible vehicle match found - investigating'),
(2, 2, 'evidence', 'Murder weapon recovered at scene'),
(2, 2, 'note', 'Awaiting forensic analysis results'),
(3, 3, 'evidence', 'Server logs obtained for analysis'),
(4, 4, 'arrest', 'Two suspects arrested at scene'),
(4, 4, 'evidence', '5kg of controlled substances seized');

-- Add Evidence
INSERT INTO evidence (crime_id, evidence_type, description, location_found, collected_by, collection_date, storage_location) VALUES
(1, 'Video', 'Security camera footage', 'Bank lobby', 2, '2024-01-15', 'Evidence Room A'),
(1, 'Physical', 'Abandoned mask', 'Alley behind bank', 2, '2024-01-15', 'Evidence Room A'),
(2, 'Physical', 'Knife - possible murder weapon', 'Warehouse floor', 2, '2024-01-21', 'Evidence Room B'),
(2, 'Biological', 'Blood samples', 'Crime scene', 2, '2024-01-21', 'Forensic Lab'),
(3, 'Digital', 'Server access logs', 'TechCorp servers', 3, '2024-02-01', 'Digital Evidence Storage'),
(4, 'Physical', 'Drug samples', 'Basement', 4, '2024-02-10', 'Evidence Room C');
