-- Create Question table
CREATE TABLE IF NOT EXISTS Question (
    QID SERIAL PRIMARY KEY,
    Problem TEXT NOT NULL,
    ModelAnswer TEXT NOT NULL,
    Field TEXT NOT NULL
);

-- Create Candidate table
CREATE TABLE IF NOT EXISTS Candidate (
    CID SERIAL PRIMARY KEY,
    Response TEXT,
    Score FLOAT,
    QID INTEGER REFERENCES Question(QID)
);

-- Sample data
INSERT INTO Question (Problem, ModelAnswer, Field) VALUES
('What is the time complexity of binary search?', 'O(logn) - Binary search eliminates half of the remaining elements in each iteration, resulting in logarithmic time complexity.', 'DSA'),
('Explain the difference between PRIMARY KEY and UNIQUE constraints in SQL.', 'PRIMARY KEY enforces uniqueness and cannot contain NULL values, with only one allowed per table. UNIQUE constraint allows one NULL value and multiple UNIQUE constraints can exist per table', 'SQL');

ALTER TABLE Candidate ADD COLUMN email TEXT UNIQUE;

INSERT INTO Candidate (Response, Score, QID,Email) VALUES
(NULL, NULL, 1,NULL),
(NULL, NULL, 2,NULL);
