WealthTwin --- Comprehensive Product & Technical Solution Specification
Document Type: Product Requirements + Technical Architecture + UI/UX Specification + Coding-Agent Implementation Guide
Product: WealthTwin
Target: Alibaba Cloud Hackathon MVP → Production-Ready SaaS Foundation
Primary Users: CEO, CFO, Finance Manager, Authorized Business/Department Managers, Organization Admin
Status: Baseline architecture/specification derived from the WealthTwin design discussions

1. Executive Summary
WealthTwin is a financial decision-intelligence platform that connects fragmented business data from ERP systems, CRM systems, accounting platforms, banks, CSV/Excel files, and future enterprise systems into a unified Financial Digital Twin.
The platform is not intended to become another generic BI dashboard.
Its central promise is:
What happened? → Why did it happen? → What will happen next? → What should we do?
WealthTwin combines:
Dynamic data connectors
AI-assisted field/schema mapping
A canonical financial data model
Financial calculations and deterministic analytics
Forecasting and anomaly/risk detection
Executive dashboards
CFO-level financial analysis
AI-powered financial reasoning
Scenario simulation
Intelligent notifications
Fine-grained role/permission controls
Configurable dashboards, metrics, fields and features
Enterprise-oriented privacy and tenant isolation
The application should feel like a premium executive financial command center, not an accounting application.

2. Product Vision
2.1 Vision
Create a system that acts as a company's Financial Digital Twin and continuously turns operational and financial data into actionable executive intelligence.
A customer should be able to connect their business systems and quickly obtain:
A unified view of financial health
A real-time/near-real-time understanding of important changes
Forecasts and risks
Explanations of financial movements
Recommended actions
"What-if" scenario analysis
2.2 Product Philosophy
WealthTwin should prioritize:
Decision support over raw reporting
Signal over noise
Explainability over opaque AI
Deterministic calculations over LLM-generated numbers
Configurability over hardcoded dashboards
Privacy over convenience
One source of truth over duplicated integrations
Executive clarity over information density

3. Core Product Differentiation
Traditional accounting software answers:
What is recorded?
Traditional BI answers:
What does the data show?
A generic AI chatbot answers:
What does the data mean?
WealthTwin should answer:
What happened, why did it happen, what is likely to happen, and what should management consider doing?
This is the primary product differentiation.

4. Target Personas
4.1 CEO
Primary question:
"Is the business healthy, where is it going, and what requires my attention?"
CEO priorities:
Revenue growth
Profitability
Cash
Business trajectory
Major risks
Customer concentration
Strategic opportunities
Major deviations from plan
Important alerts
Executive recommendations
CEO UI should be concise and strategic.
The CEO should not be overwhelmed with:
Individual transactions
Raw ERP fields
Hundreds of invoices
Technical integration details
Excessive KPI cards
4.2 CFO
Primary question:
"Why is this happening, what is the financial impact, and what can we do about it?"
CFO priorities:
Cash position
Cash forecast
AR/AP
Working capital
Revenue
Gross margin
EBITDA/operating profit
Budget vs actual
Forecast vs actual
Cost structure
Customer profitability
Product profitability
Financial risks
Forecast confidence
Scenario planning
Detailed drill-down
4.3 Finance Manager
Needs operational financial visibility:
Invoices
Payments
AR/AP
Variances
Customers
Suppliers
Transactions
Reconciliation/exception information
Configured KPIs
4.4 Department/Business Manager
Should receive only authorized business information, usually scoped by:
Region
Department
Business unit
Entity
Product
Customer group
4.5 Organization Admin
Controls:
Users
Roles
Permissions
Connectors
Field mappings
KPI definitions
Dashboards
Alerts
Data scope
AI access policies
Audit logs

5. Product Architecture Overview
                          WEALTHTWIN
                                |
                +---------------+---------------+
                |                               |
        CONTROL CENTER                    USER EXPERIENCE
                |                               |
     +----------+----------+          +---------+---------+
     |          |          |          |         |         |
 Connectors  Mapping    Metrics     CEO       CFO     Managers
     |          |          |          |         |         |
     +----------+----------+          +---------+---------+
                |                               |
                +---------------+---------------+
                                |
                     FINANCIAL DIGITAL TWIN
                                |
              +-----------------+-----------------+
              |                 |                 |
        Financial Engine   Forecast Engine    Intelligence
              |                 |                 |
              +-----------------+-----------------+
                                |
                         AI GATEWAY
                                |
                    +-----------+-----------+
                    |                       |
                  Qwen              Other/Private Model


6. High-Level Technical Stack
Frontend
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Recharts initially
Responsive layout
Accessibility-conscious components
Backend
Python
FastAPI
Pydantic
REST APIs
SSE/WebSockets where appropriate
Data
PostgreSQL as primary source of truth
Redis for caching, rate limiting and job coordination
Object storage for uploaded files/documents
Data/Financial Intelligence
Python
Pandas
NumPy
scikit-learn
Statsmodels where appropriate
XGBoost later when justified
PyTorch only for custom ML requirements
Background Processing
Celery + Redis for MVP
AI
AI Gateway abstraction
Alibaba Qwen as hackathon/reference provider
Pluggable model providers
Structured outputs
Tool calling
Privacy/context filtering
Permission-aware AI context
Infrastructure
Docker
Alibaba Cloud deployment
Managed services where practical
CI/CD via GitHub Actions
Analytics
Native WealthTwin visualizations for executive workflows
Power BI Embedded/integration for deep analytics where required

7. Critical Architecture Principle: Model-Agnostic AI
WealthTwin must NOT hard-code Qwen throughout the application.
Bad:
Dashboard -> Qwen API
Financial Service -> Qwen API
Alerts -> Qwen API

Correct:
Application
    |
    v
AI Gateway
    |
    +--> Qwen
    +--> Other LLM
    +--> Private/Customer SLM

Application-level interfaces should look conceptually like:
generate_explanation()
analyze_scenario()
extract_document()
classify_transaction()
generate_executive_brief()

The AI Gateway decides the model/provider.
Qwen is the primary/reference model for the Alibaba hackathon, but Qwen must not become an architectural dependency.

8. AI Privacy Architecture
Do not send unnecessary raw financial/customer information to the model.
Architecture:
Raw Customer Data
       |
       v
Financial Engine
       |
       v
Permission Check
       |
       v
Privacy / Context Filter
       |
       v
Relevant Aggregated Context
       |
       v
AI Gateway
       |
       v
Qwen / selected model

Example:
Raw:
Account Number: XXXXXXXX
Customer: ABC Manufacturing
Invoice #92831
Invoice Amount: $283,920

AI context may become:
Customer concentration: 18%
Overdue receivables: $283,920
Days outstanding: 71
Collection risk: High

The model should receive only what is required for the task.

9. Financial Digital Twin
The Financial Digital Twin is the core product asset.
It is a normalized representation of the customer's business financial state.
9.1 Canonical entities
Initial canonical entities:
Organization
User
Role
Legal Entity
Business Unit
Department
Region
Customer
Supplier
Product
Account
Sales Order
Sales Order Item
Purchase Order
Purchase Order Item
Invoice
Invoice Item
Payment
Expense
Expense Item
Transaction
Inventory Item
Employee/Payroll aggregate where permitted
Financial Event
Forecast
Scenario
Risk
Alert
Metric
Dashboard
Widget
Data Source
Connector
Field Mapping
The schema must remain extensible.

10. Canonical Data Model Philosophy
External systems must not leak their native schemas into the rest of the application.
Example:
SAP sales object
Salesforce opportunity
Xero invoice
QuickBooks invoice
CSV invoice_total

should be transformed into WealthTwin's canonical model.
External Sources
      |
      v
Connector
      |
      v
Raw/Source Representation
      |
      v
Mapping/Transformation
      |
      v
Canonical WealthTwin Entity
      |
      v
Financial Engine / Intelligence

This allows the same intelligence to work regardless of the customer's source system.

11. Connector Architecture
Connector types:
CSV
Excel
REST API
Salesforce
ERP systems
Accounting platforms
Banking/compliant aggregation providers
Future APIs
Each connector should implement a common interface conceptually:
connect()
authenticate()
test_connection()
discover_schema()
fetch_data()
fetch_incremental_data()
normalize()
get_sync_status()
disconnect()

The exact implementation differs by provider.

12. Dynamic CSV/Excel Onboarding
The user should be able to upload a CSV/Excel file.
Flow:
Upload
  |
  v
File Validation
  |
  v
Schema Detection
  |
  v
Entity Detection
  |
  v
AI Mapping Suggestions
  |
  v
Validation
  |
  v
Admin Approval
  |
  v
Canonical Data Ingestion

Example:
invoice_total -> Invoice.amount
cust_nm       -> Customer.name
inv_dt        -> Invoice.date
pay_stat      -> Invoice.status

Each suggestion should have:
Source field
Target field
Confidence
Reason
Validation status
Admin approval state
AI must not silently change financial mappings.

13. AI-Assisted Schema Mapping
This is a key hackathon feature.
Example workflow:
Admin uploads a CSV.
System detects columns.
AI identifies likely entities.
AI suggests canonical mappings.
Deterministic validators validate data types.
Admin reviews.
Admin approves.
Mapping is versioned.
Data is ingested.
Example output:
invoice_total -> Invoice.amount
Confidence: 98%

cust_nm -> Customer.name
Confidence: 96%

inv_dt -> Invoice.date
Confidence: 99%

The system should allow:
Approve
Reject
Edit mapping
Remap
Preview transformation
View sample records
View validation errors

14. Configuration/Control Center
Do not build a generic "admin panel".
Build a:
WealthTwin Control Center
It controls:
Organization setup
Connectors
Field mappings
KPI/metric definitions
Dashboard configuration
Alert configuration
Users
Roles
Permissions
Data scopes
AI policies
Audit logs

15. Business Profile Configuration
Organization admin can configure:
Company name
Industry
Currency
Fiscal year
Business model
Company size
Legal entities
Regions
Departments
Business units
Primary KPIs
Industry examples:
SaaS
ARR
MRR
Churn
CAC
LTV
NRR
Manufacturing
Inventory turnover
Gross margin
DSO
DPO
Capacity utilization
Order backlog
Retail
Average order value
Inventory turnover
Stock-outs
Gross margin
The dashboard should adapt to configured business context.

16. Dynamic Metric Engine
Metrics must not be hardcoded into the frontend.
A metric should have configuration metadata conceptually containing:
Metric
- id
- name
- description
- source entities
- source fields
- aggregation
- filters
- time dimension
- comparison method
- unit
- currency handling
- visibility rules
- threshold rules
- version
- status

Example:
Metric: Revenue

Source:
Sales Orders

Field:
Total Amount

Aggregation:
SUM

Filter:
Status = Completed

Time:
Order Date

Comparison:
Previous Period

The backend owns the calculation.
The frontend renders the configured result.

17. Controlled Metric Builder
Admins should NOT enter arbitrary SQL/Python.
Provide a controlled UI:
Create Metric

Name: [ Revenue ]

Source: [ Sales Orders ]

Field: [ Total Amount ]

Aggregation: [ SUM ]

Filter: [ Status = Completed ]

Date Field: [ Order Date ]

Comparison: [ Previous Period ]

Visibility:
[x] CEO
[x] CFO
[x] Finance Manager

The platform generates the internal query/calculation.

18. Dashboard Builder
Dashboards must be configuration-driven.
Dashboard object conceptually:
Dashboard
- id
- name
- persona
- layout
- widgets
- visibility
- filters
- version

Widget object:
Widget
- id
- type
- metric/query source
- title
- description
- position
- size
- permissions
- thresholds

Widget types:
KPI
Line chart
Bar chart
Area chart
Table
Trend
Forecast
Risk card
Alert card
AI briefing
Scenario card
Financial health score

19. Access Control Architecture
Use:
RBAC (Role-Based Access Control)
ABAC/data-scope policies (Attribute-Based Access Control)
Permissions should exist at:
Feature
Page/tab
Dashboard
Widget
Metric
Field/data
Record/data scope
AI capability
Export/action

20. Role Management
Default roles:
Organization Admin
CEO
CFO
Finance Manager
Department Manager
Sales Manager
Analyst
Custom Role
Admins can create custom roles.
Example:
Regional Finance Manager

Region:
Pakistan

Access:
Financial Health: View
Cash: View/Edit
Explorer: View
AI CFO: View
Integrations: No Access
User Management: No Access


21. Data Scope
Permissions can be scoped by:
Region
Business Unit
Department
Legal Entity
Product group
Customer group
Example:
Sales Manager
Region = North

They can see authorized sales data only for North.
This must be enforced at the backend/data layer, not merely by hiding frontend elements.

22. Field-Level Security
Example Customer:
Name
Industry
Revenue
Credit Limit
Bank Account
Payment Terms
Outstanding Balance

Possible access:
CEO:
Name ✓
Revenue ✓
Credit Limit ✗
Bank Account ✗

CFO:
Name ✓
Revenue ✓
Credit Limit ✓
Bank Account ✓

Sensitive data must not be sent to unauthorized clients or AI contexts.

23. AI Permission Inheritance
Hard rule:
The AI must never have more access than the user.
Pipeline:
User
 |
 v
Permission Engine
 |
 v
Authorized Data Scope
 |
 v
AI Context Builder
 |
 v
Privacy Filter
 |
 v
AI Gateway
 |
 v
Model

Example:
A Sales Manager cannot ask the AI:
"What is total payroll?"
and receive payroll information if payroll is not permitted.
The AI should respond with a permission-aware refusal.

24. Feature Permissions
Examples:
AI CFO
Scenario Simulator
Export Data
Create Alert
Configure Dashboard
Modify KPI
Connect ERP
Manage Users
Audit Logs
Financial Explorer

25. Audit Logging
Audit all sensitive configuration changes.
Example:
21 Aug 14:21
CFO Admin changed Revenue definition

21 Aug 13:10
ERP field mapping updated

21 Aug 12:45
New CFO user added

21 Aug 11:32
Alert threshold changed

Audit entries should include:
Timestamp
User
Action
Resource
Previous value where appropriate
New value
Tenant/organization
Request context where appropriate

26. Configuration Versioning
Financial definitions must be versioned.
Example:
Revenue Definition

Version 3
Changed by: CFO Admin
Previous:
SUM(Sales Orders)

New:
SUM(Paid Invoices)

[View Changes]
[Rollback]

Never silently mutate financial definitions.

27. Main Application Navigation
Recommended navigation:
Command Center
Financial Health
Cash & Working Capital
Performance & Forecast
Financial Explorer
AI CFO
Intelligence Center

----------------
Integrations
Control Center
Settings

CEO should see a simplified navigation.
CFO should receive the complete finance-oriented navigation.

28. Page 1 --- Executive Command Center
Purpose:
Tell the executive what they need to know in approximately 30 seconds.
Header
Show:
Greeting
Current organization
Last data update
Data health status
Global date range
AI search/ask bar
User profile
Example:
Good morning, Sarah.

Here's your business at a glance.

Last updated: 9:42 AM
Data health: ● All sources synced

[ Ask WealthTwin anything... ]

Today | This Month | This Quarter | This Year


29. Financial Health Score
Signature WealthTwin feature.
Example:
Financial Health

82 / 100
+4 points this month

Cash        84
Growth      73
Margin      91
Risk        62
Working     82

Score should be derived from configurable components such as:
Liquidity
Profitability
Growth
Working capital
Forecast risk
Customer concentration
Cost pressure
Data confidence
The score must be explainable.
Clicking it should show:
Financial Health decreased 3 points because DSO increased 8 days and projected Q4 cash flow decreased 11%.
Do not create an unexplained black-box score.

30. Executive KPI Cards
CEO default:
Revenue
Growth
Gross Margin
Cash
Operating Cash Flow
Profit/EBITDA
CFO default:
Revenue
Gross Margin
EBITDA
Cash
DSO
Cash Conversion Cycle
Each KPI should show:
Current value
Comparison
Direction
Context
Optional forecast
Click-through

31. Attention Required
Central executive section:
3 things require attention

Cash-flow risk
Projected cash balance falls below safety threshold in 47 days.

Customer concentration
Customer ABC represents 31% of projected quarter revenue.

Margin pressure
Gross margin declined 4.2 percentage points.

Each item:
Severity
Title
Impact
Explanation
Recommended next step
Investigate action
Scenario action where applicable

32. Business Trajectory
Show:
Revenue actual
Revenue forecast
Profit
Cash
Budget/plan where available
Forecast must display:
Forecast value
Confidence
Date range
Assumptions
Actual vs forecast
Example:
Q4 Revenue Forecast
$5.8M
Confidence: 87%


33. AI Executive Brief
Do not make this just a chatbot.
Show a generated executive briefing:
Revenue is 8.2% above plan, but gross margin has fallen 3.4 percentage points because material costs increased. Cash remains healthy, but $620K in receivables are more than 30 days overdue.
Actions:
Ask why
View analysis
Simulate impact
AI text must be based on verified financial metrics.

34. Page 2 --- Financial Health
Purpose:
Understand financial performance and causes.
Sections:
Profit & Loss
Profitability decomposition
Budget vs actual
Cost intelligence
Margin analysis

35. Profit & Loss
Metrics:
Revenue
COGS
Gross Profit
Operating Expenses
EBITDA/Operating Profit
Net Profit
Show:
            Budget    Actual    Variance
Revenue       $4.0M     $4.2M      +5%
COGS          $2.3M     $2.6M     +13%
Gross Profit  $1.7M     $1.6M      -6%
OpEx          $920K     $980K      -7%
EBITDA        $780K     $620K     -21%

Include drill-down and AI explanation.

36. Profitability Decomposition
If margin decreases:
Show drivers:
Supplier costs     -2.1%
Discounting         -0.9%
Product mix         -0.6%
Other               -0.2%

The system should identify the largest verified drivers.

37. Budget vs Actual
Show material deviations.
Avoid clutter.
Highlight:
Revenue
COGS
Payroll
Marketing
Technology
Operations
Other configured categories
Example:
Marketing  +28%  High
Cloud      +38%  High


38. Cost Intelligence
Show cost categories and trends.
More valuable than a static pie chart:
Technology spending increased 34% while revenue increased 12%.
Use:
Absolute change
Percentage change
Contribution to profit
Trend
Forecast
Threshold status

39. Page 3 --- Cash & Working Capital
This should be a hero page.
Purpose:
Understand liquidity, working capital and future cash risk.

40. Cash Position
Show:
Current cash
Available cash
Restricted cash if supported
Credit available if supported
Change vs prior period
Example:
Cash Position
1.12M+84K vs last month


41. 13-Week Cash Forecast
Show:
Current cash
Expected inflows
Expected outflows
Minimum projected cash
Safety threshold
Forecast confidence
Risk period
Example:
Projected cash falls below safety threshold in 47 days.

42. Accounts Receivable Intelligence
Show:
Total AR
Current
1–30 days
31–60 days
61–90 days
90+ days

Then identify:
High-risk receivables
Largest overdue accounts
Aging trend
Expected collection
Collection risk
Impact on cash forecast
Example:
ABC Corp  $82K  63 days
XYZ Ltd   $51K  71 days
Acme      $37K  94 days


43. Accounts Payable Intelligence
Show:
Total AP
Due this week
Due this month
Overdue
Supplier concentration
Payment schedule
Early-payment opportunity where data supports it

44. Working Capital
Show:
DSO
DPO
DIO
Cash Conversion Cycle
Explain changes:
CCC increased 11 days

+8 days DSO
+4 days inventory
-1 day DPO


45. Page 4 --- Performance & Forecast
Purpose:
Understand business trajectory and profitability.
Sections:
Revenue
Forecast
Customer intelligence
Customer profitability
Product profitability
Regional/business-unit performance
Forecast vs budget vs previous forecast vs actual

46. Revenue Analytics
Support:
Actual
Budget
Forecast
YoY
MoM
Growth
Segmentation
Potential dimensions:
Customer
Product
Region
Sales channel
Business unit
Only display dimensions supported by available data.

47. Customer Concentration
Example:
ABC Corp   31%
XYZ Ltd    18%
Acme       11%
Others     40%

Flag:
31% of projected revenue depends on one customer.
This becomes a strategic risk.

48. Customer Profitability
Example:
Customer     Revenue     Margin

ABC Corp     $820K       41%
XYZ Ltd      $460K       12%
Acme         $280K       36%

WealthTwin can surface:
XYZ generates $460K revenue but contributes only $55K gross profit.

49. Product Profitability
Example:
Product A   $1.2M   42%
Product B   $840K   38%
Product C   $620K   11%

Potential intelligence:
Product C revenue increased 24%, but profitability decreased because unit cost increased 19%.
Only claim causal relationships when supported by data.

50. Forecasting
Initial forecasts:
Revenue
Cash
EBITDA/profit
Expenses
Compare:
Actual
Current forecast
Previous forecast
Budget/plan
Show:
Confidence
Assumptions
Forecast date
Material changes

51. Page 5 --- Financial Explorer
This is the detailed drill-down page.
Do not place raw records on the executive Command Center.
Explorer categories:
Sales Orders
Invoices
Payments
Customers
Suppliers
Products
Expenses
Transactions
Inventory
Example:
SO #     Customer     Amount    Status
10293    ABC Corp     $82K      Shipped
10294    XYZ Ltd      $41K      Delayed
10295    Acme         $28K      Processing


52. Entity Relationship Drill-Down
Clicking an order should allow navigation:
Sales Order
   |
   +--> Customer
   |
   +--> Invoice
   |
   +--> Payment
   |
   +--> Cash impact

This makes the Financial Digital Twin visible to the user.

53. Page 6 --- AI CFO
The AI CFO should be a structured decision interface.
Top:
AI CFO

Ask anything about your business

[ Why did our margin decrease this month? ]

Suggested:
- Can we afford to hire 10 people?
- Which customers are becoming risky?
- Why is cash declining?
- What happens if revenue drops 15%?
- Which expenses should we investigate?


54. AI CFO Response Format
Do not return only paragraphs.
Example:
Can we afford to hire 10 engineers?

Short answer:
Yes, but with conditions.

Current cash:
$1.12M

Estimated additional annual cost:
$720K

Projected 12-month cash:
$430K

Current runway:
8.4 months

After hiring:
5.9 months

Risk:
Moderate

Recommendation:
Delay 5 hires until projected receivables are collected.

[Run Scenario]

Numbers must come from deterministic financial tools.
The LLM explains them.

55. AI Tool Architecture
Tools should be explicit and permission-aware.
Initial tools:
get_cash_position()
get_revenue()
get_profit()
get_gross_margin()
get_ebitda()
get_receivables()
get_payables()
get_working_capital()
get_customer_risk()
get_product_profitability()
forecast_cashflow()
forecast_revenue()
simulate_hiring()
simulate_revenue_change()
simulate_customer_loss()
simulate_cost_change()
compare_scenarios()

Do not give the model unrestricted database access.

56. Page 7 --- Intelligence Center
This replaces simple notifications.
Three intelligence categories:
Detected
Something is happening.
DSO increased 12%.
Predicted
Something is likely to happen.
Cash may fall below safety threshold in 43 days.
Recommended
Something should potentially be done.
Accelerating collection from 4 accounts could improve projected cash by $240K.

57. Intelligence Pipeline
Financial Events
      |
      v
Pattern Detection
      |
      v
Anomaly Detection
      |
      v
Forecasting
      |
      v
Risk Engine
      |
      v
Decision/Recommendation Engine
      |
      v
Personalized Alert

Alerts must be based on configurable rules and/or model outputs.

58. Alert Example
Input:
Sales +18%
Revenue +12%
COGS +31%
Gross Margin -4.2 points

Output:
Growth is becoming less profitable.
Revenue increased 12%, but direct costs increased 31%, reducing gross margin by 4.2 percentage points.
Potential impact: approximately $180K lower quarterly profit.
[Investigate] [Simulate Price Increase]
Do not invent causal explanations.

59. Decision Simulator
This should be a signature feature.
Examples:
What if we hire 10 engineers?
What if our largest customer churns?
What if revenue drops 15%?
What if revenue grows 20%?
What if we increase price by 5%?
What if we delay discretionary spending?
Input:
Current state
+
User scenario

Output:
                Current      Scenario

Revenue           $4.2M        $4.2M
Profit            $620K        $720K
Cash              $1.1M        $1.3M
Runway            7.8 mo       9.1 mo
Risk              Medium       Low

The Financial Engine performs calculations.
The AI explains implications.

60. Decision Simulator Architecture
User Scenario
      |
      v
Scenario Validator
      |
      v
Financial Model
      |
      v
Deterministic Calculation
      |
      v
Scenario Result
      |
      v
Risk Evaluation
      |
      v
AI Explanation

Never let the LLM invent scenario numbers.

61. Control Center --- Connector UI
Show:
Data Sources

Salesforce      Connected
ERP             Connected
Xero            Connected
Bank            Connected
CSV             Last uploaded

Each source:
Connection state
Last sync
Next sync
Records processed
Errors
Schema
Sync history

62. Control Center --- Field Mapping UI
Show source and target side-by-side:
Source Field            WealthTwin Field
invoice_total     -->   Invoice.amount
invoice_date      -->   Invoice.date
customer_name     -->   Customer.name

Include:
Confidence
Data type
Sample values
Validation
Approval state

63. Control Center --- Dashboard Builder
Admin can:
Add dashboard
Edit dashboard
Add widget
Remove widget
Reorder widgets
Resize widgets
Select metric
Configure filters
Configure visibility
Configure persona
Preview as user
Publish
Roll back version

64. Control Center --- Metric Builder
Admin can:
Create metric
Edit metric
Clone metric
Disable metric
Version metric
Set threshold
Set comparison
Set visibility
Set persona
Preview result

65. Control Center --- Access Management
Sections:
Users
Roles
Permissions
Data Policies
AI Policies
Audit Logs

66. Access Matrix
Support:
Role
  |
  +--> Page
  +--> Feature
  +--> Dashboard
  +--> Widget
  +--> Metric
  +--> Field
  +--> Data scope
  +--> AI tool
  +--> Export

Permissions:
View
Edit
Configure
Export
Administer

67. AI Policy Management
Admin should be able to configure:
Which users can use AI CFO
Which tools are allowed
Which data domains AI can access
Whether sensitive fields are excluded
Whether AI can generate recommendations
Whether AI can trigger actions in future
Whether AI output requires approval
For MVP, AI should be read/analyze/recommend, not directly execute financial actions.

68. Data Flow
External Systems
       |
       v
Connectors
       |
       v
Raw/Temporary Data
       |
       v
Schema Mapping
       |
       v
Validation
       |
       v
Canonical Financial Model
       |
       +--> PostgreSQL
       |
       +--> Financial Engine
       |
       +--> Forecasting
       |
       +--> Risk/Anomaly Engine
       |
       +--> Dashboard API
       |
       +--> AI Context Builder


69. Deterministic vs AI Responsibilities
This separation is mandatory.
Deterministic system handles:
Arithmetic
Aggregations
Financial ratios
KPI calculation
Forecast computation
Threshold detection
Data validation
Permission enforcement
Scenario calculations
AI handles:
Natural language understanding
Explanation
Summarization
Reasoning over verified results
Suggested questions
Narrative generation
Mapping suggestions
Scenario interpretation
Never ask the LLM to calculate a financial total that the backend can calculate exactly.

70. Financial Engine
Suggested modules:
financial_engine/
  cashflow/
  profitability/
  working_capital/
  revenue/
  expenses/
  forecasting/
  risk/
  anomaly/
  scenarios/
  metrics/

Functions should return structured results.
Example:
{
  "metric": "cash_position",
  "value": 1120000,
  "currency": "USD",
  "period": "2026-08-21",
  "comparison": {
    "value": 1036000,
    "change": 0.081
  }
}


71. Data Quality
Every source should have a data-health score/status.
Examples:
Synced
Delayed
Partial
Error
Mapping required
Validation failed
The UI should never silently present stale data as real-time data.

72. Data Freshness
Every important financial page should be able to show:
Last updated: 9:42 AM

If data is stale:
Data delayed
Last successful sync: 3 hours ago

Do not falsely label stale data as live.

73. Multi-Tenant Architecture
WealthTwin is intended to become SaaS.
Every tenant must have strict isolation.
Conceptually:
Tenant A
  |
  +--> Users
  +--> Data
  +--> Config
  +--> Metrics
  +--> Dashboards
  +--> AI Policies

Tenant B
  |
  +--> Users
  +--> Data
  +--> Config
  +--> Metrics
  +--> Dashboards
  +--> AI Policies

No cross-tenant data leakage.
Tenant ID must be part of authorization/data access.

74. Security Principles
Minimum requirements:
Authentication
Authorization
Tenant isolation
Encryption in transit
Encryption at rest where supported
Secrets management
Audit logging
Input validation
File validation
Rate limiting
Secure API design
Least privilege
AI context filtering
No sensitive data in client logs
No sensitive data in application error messages

75. Sensitive Data Handling
Potentially sensitive:
Bank account information
Customer financial details
Employee/payroll information
Credit information
Payment information
Business financial statements
Avoid exposing raw sensitive fields unless required and authorized.

76. Export Security
Exports should respect exactly the same permission/data scope rules as UI.
Do not allow:
User cannot view payroll
but
User can export payroll

Export must pass through authorization.

77. Backend API Structure
Suggested:
/api/v1/auth
/api/v1/organizations
/api/v1/users
/api/v1/roles
/api/v1/permissions

/api/v1/data-sources
/api/v1/connectors
/api/v1/syncs
/api/v1/mappings

/api/v1/metrics
/api/v1/dashboards
/api/v1/widgets

/api/v1/financials
/api/v1/cash
/api/v1/working-capital
/api/v1/performance
/api/v1/forecasts

/api/v1/explorer
/api/v1/scenarios
/api/v1/alerts
/api/v1/intelligence

/api/v1/ai
/api/v1/ai/tools

/api/v1/audit

Use versioning from the start.

78. Frontend Architecture
Suggested:
apps/web/

app/
  dashboard/
  financial-health/
  cash/
  performance/
  explorer/
  ai-cfo/
  intelligence/
  control-center/
  settings/

components/
  charts/
  cards/
  tables/
  layouts/
  widgets/
  ai/
  alerts/

lib/
  api/
  auth/
  permissions/
  formatting/
  validation/

types/

Do not put financial calculation logic in the frontend.

79. Backend Architecture
Suggested:
apps/api/

app/
  api/
  auth/
  organizations/
  users/
  permissions/
  connectors/
  mappings/
  metrics/
  dashboards/
  financial/
  forecasting/
  risk/
  scenarios/
  intelligence/
  ai/
  audit/
  database/

Keep business logic separate from HTTP routes.

80. Database Design Principles
PostgreSQL is the primary source of truth.
Important tables should include:
organizations
users
roles
permissions
role_permissions
user_roles
data_policies
ai_policies

data_sources
connector_configs
sync_runs
source_fields
field_mappings
mapping_versions

customers
suppliers
products
accounts
sales_orders
sales_order_items
purchase_orders
purchase_order_items
invoices
invoice_items
payments
transactions
expenses
inventory

metrics
metric_versions
dashboards
dashboard_widgets
widget_configs

forecasts
forecast_runs
scenarios
scenario_results
risks
alerts
alert_events

audit_logs

Exact schema can evolve after implementation validation.

81. Redis Use
Use Redis for:
Cache
Rate limiting
Background jobs
Temporary AI context/state
Frequently accessed dashboard results
Short-lived session data
Do not treat Redis as the permanent source of financial truth.

82. Background Jobs
Use background jobs for:
Data synchronization
Large CSV processing
Data normalization
Forecast generation
Anomaly detection
Alert generation
Document processing
Dashboard pre-aggregation
Long-running scenarios
User-facing API should not block for long-running operations.

83. Real-Time Notifications
Use SSE/WebSockets for:
AI response streaming
New critical alerts
Sync completion
Long-running scenario completion
Data freshness changes
MVP can use polling where faster to implement, but architecture should support real-time delivery.

84. Power BI Integration
Power BI should complement WealthTwin, not replace its native UI.
Native WealthTwin:
Command Center
AI CFO
Alerts
Scenario Simulator
Financial Health
Executive summaries
Power BI:
Deep historical analysis
Complex drill-downs
Custom analytical reporting

85. Visual Design Direction
The site must look:
Premium
Executive
Modern
Calm
Trustworthy
Data-rich but uncluttered
Enterprise-grade
Avoid:
Neon "AI" aesthetics
Excessive gradients
Gamer-like dashboards
Excessive glassmorphism
Huge decorative illustrations
Overly colorful charts
Chatbot-first layouts
The visual message should be:
"This is a system a CEO can trust."

86. Design Language
Recommended visual language:
Light/neutral primary workspace
Deep navy/charcoal text
Restrained accent color
Green for positive
Amber for warnings
Red for critical
Neutral gray for secondary data
Strong typography hierarchy
Generous whitespace
Subtle borders
Moderate shadows
Rounded but professional cards
Do not specify hardcoded colors in architecture; use semantic design tokens.

87. Typography
Use a professional sans-serif.
Prioritize:
Readability
Clear numerical typography
Strong KPI hierarchy
Compact table typography
Accessible contrast
Numbers should visually stand out.

88. CEO UX Principles
CEO should be able to answer within seconds:
Are we healthy?
Are we growing?
Are we profitable?
Do we have enough cash?
What is going wrong?
What could go wrong next?
What should I investigate?
If a screen cannot answer those questions quickly, it is too cluttered.

89. CFO UX Principles
CFO should be able to move:
Summary
  ->
Problem
  ->
Driver
  ->
Underlying records
  ->
Forecast
  ->
Scenario
  ->
Decision

This should be a central interaction pattern.

90. Progressive Disclosure
Do not show every detail immediately.
Example:
Gross Margin ↓ 4.2%
       |
       v
Why?
       |
       v
Supplier Costs -2.1%
Discounting -0.9%
Product Mix -0.6%
       |
       v
View affected products
       |
       v
View transactions

This creates a clean executive UI while preserving deep CFO analysis.

91. Global AI Search
Persistent top-level input:
Ask WealthTwin anything...

Examples:
Why did profit fall?
What is our cash position?
Which customers are overdue?
Can we hire five people?
What is our largest financial risk?
Which product has the lowest margin?
The AI must return citations/links to WealthTwin internal data views where possible, e.g.:
Based on 38 invoices from the current reporting period...
The user should be able to navigate to the underlying analysis.

92. AI Explainability
Every AI recommendation should expose:
Relevant metrics
Time period
Main drivers
Assumptions
Confidence where applicable
Source data scope
Link to details
Avoid:
"I think cash will decline."
Prefer:
"Cash is projected to decline because expected collections are $240K below the previous forecast while scheduled payments increase by $180K."

93. AI Hallucination Controls
The AI must:
Never invent numbers
Never invent transactions
Never invent customers
Never claim an action was performed when it wasn't
Never override permissions
Never directly access unrestricted DB data
Never execute financial actions without explicit authorization
Distinguish facts from inference
State when required data is unavailable

94. AI Response Contract
AI responses should use structured output conceptually:
{
  "summary": "...",
  "severity": "medium",
  "metrics": [],
  "drivers": [],
  "recommendations": [],
  "assumptions": [],
  "confidence": 0.87,
  "actions": []
}

Frontend then renders this safely.

95. Error Handling
User-facing errors should be human-readable.
Bad:
KeyError: Invoice.amount

Good:
We couldn't calculate AR because the Invoice Amount field mapping is incomplete.
Provide:
Error explanation
Impact
Suggested fix
Link to Control Center where appropriate

96. Empty States
Never show empty white space.
Examples:
No bank connected:
Connect your bank to unlock cash forecasting.
No customer data:
Connect a CRM or upload customer data to enable customer concentration analysis.
No forecast:
We need at least X amount of historical data before generating this forecast.

97. Loading States
Use skeleton loaders for dashboards.
For AI:
Analyzing revenue...
Checking margin drivers...
Preparing recommendation...

For sync:
Connecting
Discovering schema
Mapping fields
Validating records
Syncing


98. Accessibility
Requirements:
Keyboard navigation
Semantic HTML
Visible focus states
Accessible contrast
Tooltips with text alternatives
Charts should have textual summaries
Do not rely solely on color for severity
Screen-reader-friendly labels

99. Responsive Design
Primary target:
Desktop
Large laptop
Tablet
CEO/CFO dashboards are desktop-first.
Mobile should provide:
Summary
Alerts
AI CFO
Key KPIs
Do not attempt to squeeze every financial table into mobile.

100. Notification Channels
Architecture should support:
In-app
Email
Future SMS/WhatsApp/Teams/Slack depending on integration requirements
User should configure:
Alert type
Severity
Frequency
Quiet hours
Channel

101. Notification Deduplication
Avoid alert spam.
If the same condition remains true:
Cash risk detected

do not generate a new alert every 5 minutes.
Track:
First detected
Last detected
State
Severity
Acknowledged
Resolved

102. Alert Lifecycle
Detected
   |
   v
Open
   |
   +--> Acknowledged
   |
   v
Resolved

Potential future state:
Suppressed


103. Financial Health Score Methodology
Initial conceptual scoring:
Financial Health =
Liquidity Score
+ Profitability Score
+ Growth Score
+ Working Capital Score
+ Risk Score
+ Forecast Stability

Weights should be configurable.
The system must store:
Score
Components
Weighting/version
Calculation date
Explanation

104. Risk Engine
Potential risk categories:
Liquidity risk
Customer concentration risk
Receivables risk
Margin risk
Cost inflation risk
Supplier risk
Forecast risk
Revenue concentration
Working capital risk
Each risk should have:
Risk
- type
- severity
- probability where available
- financial impact
- detected_at
- evidence
- status
- recommended actions


105. Recommendation Engine
Recommendations should be generated from verified conditions.
Example:
Condition:
High overdue AR

Potential recommendation:
Prioritize collection from highest-value overdue accounts.

The recommendation should include:
Reason
Estimated impact if calculable
Confidence
Supporting metrics
Relevant entities
Suggested next action

106. Opportunity Detection
WealthTwin should eventually detect not only risks but opportunities.
Examples:
Cost optimization
Underutilized inventory
High-margin customer expansion
Pricing opportunity
Early payment discount
Working-capital optimization
Revenue concentration reduction
UI section:
Opportunities

$120K potential cost optimization
$240K cash improvement opportunity
$85K high-margin expansion opportunity

Only surface opportunities where data supports the estimate.

107. Product-Level "Signal over Noise" Rule
Every executive page should prioritize:
Material changes
Risks
Opportunities
Forecast deviations
Decision-relevant KPIs
Supporting detail
Raw data belongs deeper in the system.

108. MVP Scope for Alibaba Hackathon
The MVP should focus on a convincing end-to-end demonstration.
Must Have
Next.js executive dashboard
FastAPI backend
PostgreSQL
CSV upload
Dynamic schema detection
AI-assisted field mapping
Canonical financial model
Financial Health score
Revenue
Gross margin
Cash
AR/AP
13-week cash forecast or representative cash forecast
Risk detection
Intelligence Center
AI CFO
Scenario simulator
Role-based permissions
Dynamic dashboard/metric configuration
Alibaba/Qwen AI integration
Alibaba Cloud deployment
Strong Demo Features
AI-generated executive brief
"Why?" drill-down
Customer concentration
Customer profitability
AI schema mapping
"What if revenue drops 15%?"
Personalized alerts
Permission-aware AI

109. Features to Defer
Do not overbuild the hackathon MVP with:
Kubernetes
Kafka
Complex microservice mesh
Custom LLM training
Customer-specific SLM deployments
Full banking integrations for every country
Dozens of ERP integrations
Mobile app
Fully autonomous financial actions
Complex graph database unless proven necessary
Architecture should remain extensible without implementing everything.

110. Suggested MVP Demo Scenario
Use a realistic fictional company.
Example:
Nova Manufacturing Ltd.
Data sources:
CSV ERP export
CRM export
Bank/cash CSV
The demo flow:
1. Admin uploads ERP CSV
2. WealthTwin detects schema
3. Qwen suggests mappings
4. Admin approves
5. Data ingests
6. Financial Twin builds
7. Dashboard appears
8. Financial Health = 82
9. System detects margin pressure
10. System detects overdue AR
11. Cash forecast shows future risk
12. AI Executive Brief explains situation
13. CFO asks "Why is profit declining?"
14. AI drills into supplier costs
15. CFO asks "Can we hire 10 engineers?"
16. Scenario Simulator calculates impact
17. AI explains result
18. CFO receives recommended action

This is the ideal hackathon narrative.

111. Startup Evolution
After MVP, evolve toward:
Phase 2
More ERP connectors
Accounting platforms
Bank aggregation
Better forecasting
More industry templates
Power BI integration
Advanced permissions
Enterprise audit controls
Phase 3
Multi-entity consolidation
Advanced financial planning
Budgeting
Scenario planning
Cash optimization
Automated reconciliation
Phase 4
Enterprise/private AI deployments
Customer-hosted models
Advanced agentic workflows
Controlled action execution

112. Long-Term Product Moat
Potential defensibility comes from:
Canonical financial model
Connector framework
Dynamic mapping engine
Financial metric configuration
Financial Digital Twin
Decision/simulation engine
Permission-aware AI
Industry-specific intelligence
Historical business context
Financial event/decision history
The moat should not simply be "we use Qwen".

113. Coding Agent Rules
The coding agent should follow these rules.
Rule 1
Do not hardcode dashboard metrics when a configurable metric abstraction is appropriate.
Rule 2
Do not hardcode ERP-specific fields into financial intelligence.
Rule 3
Do not put financial calculation logic in React.
Rule 4
Do not allow AI to calculate financial totals that the backend can calculate.
Rule 5
Do not give the AI unrestricted database access.
Rule 6
All sensitive data access must pass through authorization.
Rule 7
AI must inherit the requesting user's permissions.
Rule 8
Use tenant-aware data access everywhere.
Rule 9
Every major configuration change should be versionable/auditable.
Rule 10
Build reusable components rather than page-specific duplicates.
Rule 11
Do not create fake real-time data and label it real-time.
Rule 12
When demo/mock data is used, make the data source clearly identifiable as demo data in development.

114. Frontend Coding Guidelines
Use:
TypeScript strict mode
Reusable components
Typed API responses
Centralized design tokens
Centralized API client
Centralized permission checks
Error boundaries
Loading states
Empty states
Accessible components
Avoid:
Massive components
Inline business logic
Hardcoded financial values
Duplicate API logic
CSS scattered across components
Direct database assumptions in UI

115. Component Architecture
Suggested components:
AppShell
Sidebar
TopBar
CommandBar

KpiCard
TrendCard
FinancialHealthCard
RiskCard
AlertCard
OpportunityCard
ForecastChart
ComparisonChart
DataTable
MetricDetailDrawer
DrillDownPanel
AiBrief
AiChat
ScenarioSimulator
PermissionGate
DataScopeBadge
FreshnessIndicator
SyncStatus


116. PermissionGate
Frontend can use a permission-aware wrapper for UX:
<PermissionGate permission="financial.payroll.view">
   ...
</PermissionGate>

But remember:
Frontend permission checks are for UX only.
Backend authorization is mandatory.

117. API Response Design
Responses should be structured and versioned.
For a KPI:
{
  "id": "revenue",
  "label": "Revenue",
  "value": 4200000,
  "currency": "USD",
  "period": "2026-Q3",
  "comparison": {
    "type": "previous_period",
    "value": 3740000,
    "change_percent": 12.3
  },
  "status": "positive",
  "freshness": {
    "updated_at": "2026-08-21T09:42:00Z"
  }
}


118. Observability
Log and monitor:
API errors
Connector failures
Sync duration
Mapping failures
Forecast failures
AI latency
AI errors
Permission denials
Background job failures
Database performance
Never log sensitive financial data unnecessarily.

119. Testing Strategy
Unit tests
Financial calculations
Metric engine
Permission engine
Mapping validation
Forecast calculations
Integration tests
Connector ingestion
Database
API
AI Gateway
Permission filtering
End-to-end tests
Critical user journeys:
Upload CSV
Map fields
Approve mapping
View dashboard
Ask AI
Run scenario
Create role
Restrict metric
Verify restricted user cannot access it

120. Security Test Cases
Must test:
Tenant A cannot access Tenant B
Unauthorized role cannot access restricted page
Unauthorized role cannot access restricted API
Unauthorized role cannot access restricted field
Unauthorized role cannot export restricted data
AI cannot retrieve unauthorized data
Data scope is enforced
Sensitive values are not exposed in logs
Uploaded files are validated
Malicious input is rejected

121. Performance Goals for MVP
Targets should be treated as engineering goals, not absolute guarantees:
Dashboard initial API response: ideally < 1--2 seconds for cached/optimized views
Standard CRUD/API requests: typically < 500ms where practical
AI response: stream response when possible
Large data ingestion: asynchronous
Scenario simulations: asynchronous when computationally expensive
Dashboard should render progressively

122. Scalability Strategy
MVP:
Next.js
FastAPI
PostgreSQL
Redis
Celery
Alibaba Cloud

Later:
API
  |
  +--> Ingestion workers
  +--> Financial engine workers
  +--> Forecast workers
  +--> AI gateway
  +--> Notification workers

Only split services when there is a concrete operational reason.

123. Why We Are Not Building a Separate SLM Per Customer Initially
Customer-specific SLM deployment can improve isolation but introduces:
Infrastructure cost
Deployment complexity
Model lifecycle management
Scaling problems
Monitoring complexity
Versioning complexity
Instead:
Customer Data
    |
Privacy/Permission Layer
    |
AI Gateway
    |
Qwen / approved model

Enterprise/private model deployment can be introduced later.

124. AI Gateway Future Model Routing
Eventually:
Task
 |
 v
Model Router
 |
 +--> Small model: classification
 |
 +--> Qwen: executive reasoning
 |
 +--> Multimodal model: documents
 |
 +--> Private model: regulated enterprise

This improves cost/performance without coupling the product to one model.

125. Core Startup Positioning
Recommended positioning:
WealthTwin is an AI-powered Financial Digital Twin that turns fragmented business data into executive intelligence, forecasts, risk signals and actionable decisions.
Alternative short positioning:
Your company's financial reality, modeled, explained and projected.
Long-term message:
Connect your business. Build your Financial Twin. Make better decisions.

126. Product Principle to Preserve
The product should never become:
ERP + another dashboard + chatbot

It should become:
Data
  ↓
Financial Digital Twin
  ↓
Understanding
  ↓
Prediction
  ↓
Decision


127. Final User Experience
The ideal executive journey:
CEO opens WealthTwin
        |
        v
Financial Health: 82
        |
        v
"3 things require attention"
        |
        v
Cash-flow risk
        |
        v
Why?
        |
        v
AR collections are delayed
        |
        v
What happens next?
        |
        v
13-week forecast
        |
        v
What should we do?
        |
        v
AI recommendation
        |
        v
What if we delay spending?
        |
        v
Scenario Simulator
        |
        v
Decision

This should feel like a continuous decision loop, not a reporting workflow.

128. Final Implementation Priority
Build in this order:
Phase 1 --- Foundation
Repository
Next.js
FastAPI
PostgreSQL
Redis
Auth
Tenant model
Design system
Phase 2 --- Data
CSV upload
Schema discovery
Mapping model
Mapping UI
Canonical financial entities
Ingestion pipeline
Phase 3 --- Executive Dashboard
Command Center
KPI engine
Financial Health
Alerts
Data freshness
Phase 4 --- Financial Intelligence
Cash
AR/AP
Working capital
Profitability
Forecasting
Risk engine
Phase 5 --- AI
AI Gateway
Qwen
Tool registry
Context builder
Permission-aware AI
Executive Brief
AI CFO
Phase 6 --- Decisions
Scenario engine
Scenario UI
Recommendations
Intelligence Center
Phase 7 --- Control Center
Users
Roles
Permissions
Field security
Data scopes
Metric builder
Dashboard builder
Audit logs
Versioning
Phase 8 --- Polish
Premium UI
Loading/empty/error states
Responsive design
Accessibility
Performance
Security testing
Demo data
Hackathon presentation flow

129. Definition of Done for the Hackathon MVP
The MVP is successful when a judge can see:
A company connecting/uploading data
WealthTwin dynamically understanding the data
AI-assisted mapping
A Financial Digital Twin being populated
Executive Command Center
Financial Health score
Revenue/profit/cash intelligence
Cash forecast
Risk detection
Intelligent notification
AI explanation
Scenario simulation
Permission-aware user views
Dynamic configuration through Control Center
Alibaba/Qwen-powered AI
A polished executive-grade interface
Most importantly, the demo should tell a story:
The system didn't just show us that something was wrong. It discovered it, explained why it mattered, predicted what could happen next, and allowed the CFO to test what decision would change the outcome.

130. Final Architecture
                                     WEALTHTWIN
                                           |
             +-----------------------------+-----------------------------+
             |                                                           |
       CONTROL CENTER                                             USER EXPERIENCE
             |                                                           |
    +--------+--------+                                     +------------+------------+
    |        |        |                                     |            |            |
 Connectors Mapping Metrics                              CEO           CFO        Managers
    |        |        |                                     |            |            |
    +--------+--------+                                     +------------+------------+
             |                                                           |
             +----------------------------+------------------------------+
                                          |
                              FINANCIAL DIGITAL TWIN
                                          |
                   +----------------------+----------------------+
                   |                      |                      |
             Financial Engine       Forecast Engine        Risk Engine
                   |                      |                      |
                   +----------------------+----------------------+
                                          |
                                  Intelligence Engine
                                          |
                              +-----------+-----------+
                              |                       |
                         Recommendations          Alerts
                              |
                              v
                          AI GATEWAY
                              |
                    +---------+---------+
                    |                   |
                  Qwen          Other/Private Models
                    |
                    v
                 AI CFO
                    |
                    v
             Executive Decision Layer
                    |
                    v
             Scenario Simulator


131. Final Product Rule
If a coding decision is unclear, prioritize in this order:
Security and tenant isolation
Financial correctness
Permission correctness
Data traceability
Explainability
Executive usability
Configurability
Performance
Visual polish
Feature breadth
Never sacrifice financial correctness or authorization for a visually impressive demo.

132. Closing Product Definition
WealthTwin is not primarily a dashboard.
It is not primarily a chatbot.
It is not primarily an ERP connector.
It is not primarily an AI model.
It is a Financial Decision Intelligence Platform built around a continuously updated Financial Digital Twin.
The platform takes:
ERP
CRM
Bank
Accounting
CSV
Excel
Other business systems

and transforms them into:
Unified Financial Reality
        ↓
Financial Understanding
        ↓
Forecast
        ↓
Risk
        ↓
Opportunity
        ↓
Recommendation
        ↓
Scenario
        ↓
Executive Decision

The frontend should make this experience feel simple, premium and trustworthy even though the underlying platform is technically sophisticated.
The CEO should see clarity.
The CFO should see depth.
The administrator should see control.
The AI should see only what it is allowed to see.
And the underlying system should remain dynamic enough to support many businesses and data sources without rewriting the product for each customer.

133. Data Ingestion, Storage & Synchronization Architecture
This section is mandatory for the WealthTwin implementation. The platform is expected to ingest potentially large volumes of data from CRMs, ERPs, accounting systems, banks, CSV/Excel files and other enterprise sources. WealthTwin must therefore not repeatedly download complete datasets after the initial integration.
The synchronization architecture must support:
Initial bulk ingestion
Incremental synchronization
Webhook/event-driven synchronization where supported
Scheduled synchronization/polling
Periodic reconciliation
Checkpoint/cursor management
Batch processing
Rate limiting
Retry and exponential backoff
Failed-job recovery
Data validation
Raw/staging storage
Canonical operational storage
Analytical aggregation
Data freshness tracking
Data retention and deletion
Sync monitoring and auditability
The system must be designed so that adding a large CRM/ERP customer does not require loading the complete dataset into application memory or repeatedly pulling the entire source dataset.

134. Three-Layer Data Storage Architecture
WealthTwin should conceptually maintain three data layers.
External Sources
      |
      v
+-----------------------+
|  RAW / STAGING LAYER  |
| Original source data  |
+-----------+-----------+
            |
            v
+-----------------------+
| CANONICAL DATA LAYER  |
| WealthTwin data model |
+-----------+-----------+
            |
            v
+-----------------------+
| ANALYTICAL / METRIC   |
| AGGREGATIONS          |
+-----------------------+

134.1 Raw/Staging Layer
The raw layer preserves source data sufficiently to support:
Reprocessing
Debugging
Data lineage
Mapping changes
Recovery from transformation failures
Connector troubleshooting
Historical ingestion diagnostics
For large datasets, raw data should preferably be stored in object storage rather than forcing all source payloads into PostgreSQL.
Raw data should be associated with:
Tenant
Data source
Provider
Entity
Source record ID
Ingestion batch
Ingestion timestamp
Source modification timestamp where available
Schema/mapping version
Do not expose raw source data directly to normal end users unless explicitly authorized.
134.2 Canonical Data Layer
After validation and transformation, data is converted into the WealthTwin canonical model.
Examples:
Salesforce Opportunity
        ↓
Opportunity Mapping
        ↓
WealthTwin Revenue/Sales Entity

The canonical layer is what WealthTwin's application and financial intelligence use.
Typical entities include:
customers
suppliers
products
sales_orders
sales_order_items
purchase_orders
purchase_order_items
invoices
invoice_items
payments
transactions
expenses
inventory

PostgreSQL is the initial canonical operational database.
134.3 Analytical/Aggregation Layer
Executive dashboards should not repeatedly scan millions of raw operational records.
Maintain optimized aggregates/materialized analytical structures for commonly requested metrics, such as:
Daily revenue
Monthly revenue
Customer revenue
AR aging
AP aging
Cash position
Gross margin
Revenue by product
Revenue by region
Cost by category
The exact implementation may use PostgreSQL materialized views, summary tables, pre-aggregation jobs, or a dedicated analytical store as scale requires.

135. Initial Bulk Synchronization
When a customer connects a source for the first time, WealthTwin performs an initial synchronization.
Connect
   ↓
Authenticate
   ↓
Discover Source Schema
   ↓
Suggest/Configure Field Mapping
   ↓
Validate Mapping
   ↓
Start Initial Sync
   ↓
Paginated/Batched Extraction
   ↓
Raw/Staging Storage
   ↓
Transformation
   ↓
Validation
   ↓
Canonical Data
   ↓
Metric/Aggregation Refresh
   ↓
Financial Intelligence

The initial synchronization must be asynchronous.
The frontend should display progress rather than blocking the user.
Example:
Salesforce

Initial synchronization

Accounts        100%
Contacts         78%
Opportunities    52%

Records processed: 8,421,392

Status: Running

The system should expose:
Total records discovered where available
Records processed
Records succeeded
Records failed
Current entity
Current batch
Estimated progress where reliable
Start time
Last update
Error count
Completion status

136. Incremental Synchronization
After initial synchronization, WealthTwin must normally fetch only data that changed since the previous successful checkpoint.
The connector should use provider-supported mechanisms such as:
Last-modified timestamps
Change tracking APIs
Incremental query filters
Provider cursors
Change data capture
Delta APIs
Other provider-specific mechanisms
Conceptually:
Initial Sync
    ↓
10,000,000 records

Next Sync
    ↓
Only records changed since checkpoint

For a source supporting modification timestamps:
Source records where modified_at > last_successful_cursor

The implementation must be provider-specific behind a common connector interface.

137. Hybrid Synchronization Model
WealthTwin should not choose exclusively between "live sync" and "scheduled sync."
The recommended architecture is a hybrid:
                   SYNC ENGINE
                         |
          +--------------+--------------+
          |              |              |
          v              v              v
      Webhooks       Scheduler      Reconciliation
     / Events       Incremental        / Repair
      Near-real       Polling
       time

137.1 Webhook/Event Synchronization
Where the source supports reliable webhooks/events:
Source System
     |
     | Record changed
     v
WealthTwin Webhook Endpoint
     |
     v
Validation
     |
     v
Ingestion Queue
     |
     v
Record Fetch/Transformation
     |
     v
Canonical Data Update
     |
     v
Affected Metrics Recalculated
     |
     v
Risk/Alert Evaluation

Example:
CRM opportunity:
$200K → $100K

        ↓

Revenue/forecast model updated

        ↓

Forecast changes

        ↓

Risk engine evaluates

        ↓

Potential executive alert

Webhooks provide near-real-time behavior, but they must not be treated as the only source of truth.
137.2 Scheduled Incremental Synchronization
Some systems will not provide reliable webhooks, and some entities may not need event-level synchronization.
Support configurable schedules such as:
5 minutes
15 minutes
30 minutes
1 hour
6 hours
Daily

The actual available frequency should depend on:
Provider capabilities
API limits
Customer plan
Data criticality
Connector behavior
Cost
Examples:
CRM:
15-minute incremental sync

ERP:
30-minute incremental sync

Bank:
Provider-appropriate periodic sync

Historical/static data:
Daily sync

The platform must never promise real-time behavior when the source does not support it.

138. Periodic Reconciliation
Webhooks and incremental polling can still fail.
Potential failures include:
Webhook delivery failure
Network interruption
API timeout
Provider outage
Expired credentials
Incorrect cursor
Temporary rate limiting
Missed events
Therefore WealthTwin must periodically reconcile its canonical state against the source.
WealthTwin
    |
    v
Reconciliation Job
    |
    v
Source System
    |
    v
Compare/check source state
    |
    +--> Missing records
    +--> Changed records
    +--> Deleted records
    |
    v
Repair/Resync

Reconciliation does not necessarily mean downloading the entire source dataset every night.
Use provider-supported change tracking, IDs, timestamps, checksums, deletion APIs or targeted comparisons where available.

139. Sync Checkpoints and Cursors
Every incremental synchronization must maintain a durable checkpoint.
Conceptual model:
SyncCursor
----------------------------
data_source_id
tenant_id
entity
cursor
last_modified_at
last_record_id
status
updated_at

Example:
Salesforce
Entity: Opportunity

Last successful sync:
2026-08-21 21:45

Cursor:
2026-08-21T21:45:31Z

Created:
183

Updated:
12,421

Deleted:
42

The cursor must only advance after the corresponding batch has been successfully processed according to the connector's consistency rules.

140. Sync Runs
Each synchronization execution should have a durable record.
Conceptual model:
SyncRun
----------------------------
id
tenant_id
data_source_id
sync_type
status
started_at
completed_at
records_discovered
records_processed
records_created
records_updated
records_deleted
records_failed
cursor_start
cursor_end
error_summary

Possible statuses:
QUEUED
RUNNING
COMPLETED
PARTIAL
FAILED
CANCELLED

This powers the Control Center's Sync History.

141. Batch Processing
Large source datasets must be processed in batches.
Do not:
Fetch millions of records
      ↓
Load all into RAM
      ↓
Process

Instead:
Source
  ↓
Batch 1
  ↓
Queue
  ↓
Transform/Validate
  ↓
Persist

Batch 2
  ↓
Queue
  ↓
Transform/Validate
  ↓
Persist

...

Batch size should be configurable per connector/provider.
Benefits:
Lower memory usage
Better retry behavior
Parallel processing where safe
Checkpointing
Better observability
Easier recovery

142. Failure Recovery and Checkpoint Resume
A failed synchronization must not normally restart from zero.
Example:
10,000,000 records

Processed:
7,400,000

Network failure

The system should retain the checkpoint and resume from an appropriate durable position:
Resume
   ↓
7,400,000
   ↓
10,000,000

Processing must be designed to be idempotent.
If a batch is accidentally processed twice, WealthTwin should not create duplicate canonical records.
Use source-system identifiers and appropriate uniqueness constraints/upsert semantics.

143. API Rate Limiting
Enterprise connectors must respect source API limits.
The connector framework should include:
Rate Limiter
Retry Manager
Exponential Backoff
Pagination
Circuit Breaker
Dead Letter Queue

Example:
API request
    ↓
429 / Rate Limit
    ↓
Retry-After / Backoff
    ↓
Retry
    ↓
Continue

The platform must avoid overwhelming customer systems.

144. Dead Letter Queue
Records/events that repeatedly fail processing should be isolated instead of blocking the entire synchronization.
Example:
Sync Batch
   |
   +--> 4,999 successful
   |
   +--> 1 failed
           ↓
      Dead Letter Queue

The Control Center should show:
Failed record/entity
Error category
Number of retries
Last attempt
Source identifier
Recommended resolution
Retry action
An administrator should be able to retry failed items after fixing mappings/configuration.

145. Idempotency
Connector ingestion must be idempotent.
A source record should have a stable identity such as:
tenant_id
data_source_id
source_entity
source_record_id

This prevents:
same Salesforce Opportunity
       ↓
processed twice
       ↓
two WealthTwin Opportunities

Instead:
same source ID
       ↓
upsert existing canonical record


146. Data Change Propagation
Not every source change requires recalculating every WealthTwin metric.
Use dependency-aware recalculation.
Example:
Invoice updated
     |
     +--> AR
     +--> Revenue
     +--> Cash forecast
     +--> Customer balance
     +--> Working capital

Only affected metrics/aggregations should be refreshed.
This reduces computational cost and improves response time.

147. Data Freshness Model
Every important data result should have freshness metadata.
Example:
Last updated:
9:42 AM

Source:
Salesforce

Data status:
Healthy

Possible states:
FRESH
STALE
DELAYED
PARTIAL
ERROR
SYNCING

A stale dashboard must never silently appear to be live.

148. Source and Entity-Level Freshness
Freshness should be tracked at more than just the organization level.
Example:
Salesforce:
  Opportunities — 2 min ago
  Accounts — 3 min ago

ERP:
  Invoices — 14 min ago
  Expenses — 2 hours ago

Bank:
  Transactions — 5 hours ago

The UI can surface the relevant freshness information where it matters.

149. Data Deletion and Source Changes
The sync architecture must account for deleted records.
Depending on provider capabilities, use:
Delete events
Tombstones
Deleted-record APIs
Change data capture
Periodic reconciliation
WealthTwin must define whether the canonical record is:
Deleted
Soft-deleted
Archived
Marked as source-deleted
based on the entity and retention requirements.
Do not silently retain records indefinitely after source deletion.

150. Data Retention
Retention must be configurable by:
Tenant
Data type
Source
Contract/plan
Applicable compliance requirements
Potential categories:
Raw source payloads
Canonical operational data
Aggregated analytics
Audit logs
AI interaction metadata
Sync logs

Raw data generally should not be retained indefinitely without a reason.
The implementation must make retention policies possible rather than assuming every source record is permanent.

151. Large-Scale Data Evolution
For MVP, the recommended stack remains:
Next.js
FastAPI
PostgreSQL
Redis
Celery
Alibaba Cloud Object Storage

At larger scale, the architecture can evolve toward:
                Sources
                    ↓
             Connector Layer
                    ↓
              Ingestion Queue
                    ↓
             Raw Object Storage
                    ↓
            Transformation Layer
                    ↓
          +---------+---------+
          |                   |
          v                   v
 Operational DB        Analytics Store
 PostgreSQL             Warehouse/Lakehouse
          |                   |
          +---------+---------+
                    ↓
             Financial Engine
                    ↓
             Intelligence
                    ↓
                   AI

Do not introduce a complex warehouse/lakehouse architecture into the hackathon MVP unless actual data volume requires it. The interfaces should, however, allow it to be added later.

152. Connector Contract — Updated
Every connector should conceptually support:
connect()
authenticate()
disconnect()

test_connection()

discover_schema()

initial_sync()
incremental_sync()

subscribe_to_events()       # when supported
handle_webhook_event()      # when supported

fetch_page()
fetch_batch()
fetch_changed_records()
fetch_deleted_records()     # when supported

get_cursor()
save_cursor()

get_sync_status()
get_source_limits()

reconcile()

retry_failed_records()

Not every provider supports every operation. The connector should explicitly advertise its capabilities.

153. Connector Capability Model
Each connector should expose capabilities such as:
supports_webhooks
supports_incremental_sync
supports_deleted_records
supports_bulk_api
supports_cursor
supports_reconciliation
supports_schema_discovery

The Control Center can then configure synchronization according to actual provider capabilities.
Example:
Salesforce

Webhooks:          Supported
Incremental Sync:  Supported
Bulk API:          Supported
Deleted Records:   Supported

The system should never assume a connector supports a feature it does not actually implement.

154. Customer Sync Configuration
The Control Center should provide a synchronization configuration screen:
Salesforce

Connection: Connected

Synchronization Mode

[x] Incremental Sync
[x] Webhook Events

Schedule
[ Every 15 minutes ]

Historical Data
[ Last 24 months ]

Entities
[x] Accounts
[x] Opportunities
[x] Orders
[ ] Contacts
[ ] Activities

Reconciliation
[ Daily ]

[Save Configuration]

The available controls should depend on connector capabilities.

155. Sync Dashboard
The Control Center should contain a dedicated:
Data & Sync Health
Example:
Overall Data Health
94 / 100

Salesforce       ● Healthy
ERP              ● Healthy
Bank             ● Delayed
CSV              ● Manual

Last sync:
9:42 AM

Records processed today:
1,842,921

Failed:
128

[View Sync History]
[View Errors]

This is important for enterprise trust.

156. Sync Alerts
Administrators should receive alerts for:
Authentication failure
Source API outage
Repeated sync failures
Data mapping failure
Significant sync delay
Unexpected record-volume changes
Data validation failures
Reconciliation discrepancy
Example:
ERP synchronization delayed
Last successful sync: 3h 42m ago.
The dashboard is currently using the last successfully synchronized dataset.

157. Important Distinction: Source Data vs WealthTwin Intelligence
WealthTwin should not blindly copy every field from every system.
The ingestion layer can discover and retain source fields, but the canonical/analytics layers should prioritize fields required for:
Financial reporting
Decision intelligence
Forecasting
Risk
Recommendations
Configured customer metrics
This helps prevent the platform from becoming a giant uncontrolled data dump.

158. Data Volume Strategy
For every connector, classify data as:
Tier 1 — Decision-Critical
Examples:
Invoices
Payments
Sales Orders
Revenue
Expenses
Cash transactions
Higher synchronization priority.
Tier 2 — Analytical
Examples:
Customers
Products
Suppliers
Opportunities
Normal incremental synchronization.
Tier 3 — Contextual
Examples:
Activities
Notes
Historical metadata
Synchronize only when required by enabled features/use cases.
This helps control:
API usage
Storage
Processing
Cost
Latency

159. Data Synchronization Priority
The scheduler should support priority.
Example:
Priority 1:
Cash / Payments / Invoices

Priority 2:
Orders / Revenue

Priority 3:
Customers / Products

Priority 4:
Contextual CRM activities

A high-priority financial update should not wait behind millions of low-priority CRM activity records.

160. Revised Data Architecture Principle
The final principle for the coding agent is:
WealthTwin is not a data dump. It is a continuously synchronized financial intelligence layer.
The system should ingest enough source information to construct and maintain the Financial Digital Twin while using incremental synchronization, event-driven updates, aggregation, retention controls and source-aware storage to remain scalable.
 

161. Comprehensive UI/UX Implementation Specification
The existing UI sections define the major information architecture. This section makes the visual and interaction requirements explicit enough for a coding agent to implement the intended WealthTwin experience without inventing a different product.
161.1 UX Principle
WealthTwin must feel like a premium executive financial command center, not an accounting application, spreadsheet, generic BI dashboard, or chatbot.
Core interaction:
SIGNAL → CONTEXT → EXPLANATION → EVIDENCE → ACTION → SCENARIO → DECISION

Use progressive disclosure: executives see the signal first, then the reason, then the evidence, then the action.
161.2 Global Application Shell
┌─────────────────────────────────────────────────────────────────────┐
│ Logo / Workspace     Search / Ask WealthTwin              Avatar   │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                      │
│ Command      │                  Page Content                        │
│ Center       │                                                      │
│ Financial    │                                                      │
│ Health       │                                                      │
│ Cash         │                                                      │
│ Performance  │                                                      │
│ Explorer     │                                                      │
│ AI CFO       │                                                      │
│ Intelligence │                                                      │
│              │                                                      │
│ Integrations │                                                      │
│ Control Ctr  │                                                      │
│ Settings     │                                                      │
└──────────────┴──────────────────────────────────────────────────────┘

Use a fixed/collapsible desktop sidebar. On tablet/mobile it becomes a drawer. Navigation is permission-driven and the backend remains authoritative.
161.3 Top Bar
Every primary page uses:
[Page title] [Breadcrumb]
[Date Range] [Entity/Region Filter] [Freshness] [Ask WealthTwin] [Notifications] [Profile]

Date presets: Today, This Week, This Month, This Quarter, This Year, Previous Period, Custom.
Only show filters relevant to the current page and user's scope.
Freshness example:
● Data healthy
Updated 2 min ago

Clicking freshness opens source-level health details.
161.4 Global Ask WealthTwin
Use a prominent but restrained command bar:
┌─────────────────────────────────────────────────────────────┐
│ ✦ Ask WealthTwin anything about your business...            │
└─────────────────────────────────────────────────────────────┘

Suggested questions include:
Why did gross margin fall this month?
Can we afford to hire 10 engineers?
Which customers represent the largest revenue risk?
Why is cash expected to decline?
What changed since last month?
When launched from a metric/page, automatically include the authorized page context.
161.5 Notification Center
Categories:
Critical | Risk | Forecast | Operational | Data/Sync | Recommendation

Each notification contains severity, title, explanation, timestamp, source, related metric/entity, read state and action. Notifications deep-link to the relevant evidence.
162. Executive Command Center — Complete Layout
Primary CEO landing page:
┌──────────────────────────────────────────────────────────────┐
│ Good morning, Sarah.                                         │
│ Here's your business at a glance.                            │
│ Updated 9:42 AM ● All sources healthy                       │
│ [Ask WealthTwin...]                    [This Quarter ▼]       │
├──────────────────────────────────────────────────────────────┤
│ FINANCIAL HEALTH                                              │
│ 82 / 100   ↑4   Cash 84 | Growth 73 | Margin 91 | Risk 62   │
├──────────────────────────────────────────────────────────────┤
│ Revenue | Growth | Gross Margin | Cash | EBITDA              │
├──────────────────────────────────────────────────────────────┤
│ 3 THINGS REQUIRE ATTENTION      BUSINESS TRAJECTORY          │
│ Cash-flow risk                  Actual / Forecast             │
│ Customer concentration          Revenue / Profit / Cash       │
│ Margin pressure                 Budget where available       │
├──────────────────────────────────────────────────────────────┤
│ AI EXECUTIVE BRIEF                                            │
│ Verified summary + [Ask Why] [View Analysis] [Simulate]      │
├──────────────────────────────────────────────────────────────┤
│ TOP OPPORTUNITIES                 RECENT INTELLIGENCE         │
└──────────────────────────────────────────────────────────────┘

The page should answer within roughly 30 seconds: How are we doing? What changed? What is risky? What should I investigate?
162.1 Financial Health Card
Large score with explainable components:
82 / 100
+4 this month

Cash 84
Growth 73
Margin 91
Risk 62
Working Capital 82

Clicking a component opens the drivers and evidence. Never present the score as a black box.
162.2 KPI Cards
CEO default:
Revenue
Growth
Gross Margin
Cash
Operating Cash Flow
Profit/EBITDA
CFO default:
Revenue
Gross Margin
EBITDA
Cash
DSO
Cash Conversion Cycle
Each card contains current value, comparison, direction, optional sparkline, context, freshness and click-through.
162.3 Attention Cards
Each card contains severity, title, impact, explanation, recommended next step and optional scenario action.
Example:
HIGH
Cash-flow risk
Projected cash falls below safety threshold in 47 days.
Impact: $240K
Confidence: High
[Investigate] [Run Scenario]

163. Financial Health Page
Layout:
Page Header
↓
KPI Summary
↓
Profit & Loss
↓
Profitability Decomposition
↓
Budget vs Actual
↓
Cost Intelligence
↓
Margin Analysis

P&L must support Budget / Actual / Variance, drill-down and AI explanation.
When EBITDA or margin changes, show verified drivers such as supplier cost, discounting, product mix and operating expenses.
164. Cash & Working Capital Page
This is a hero CFO page.
Cash Position
↓
13-Week Cash Forecast
↓
AR Aging + High-Risk Receivables
↓
AP Schedule
↓
Working Capital / CCC

Cash forecast must visually distinguish actuals, forecast, safety threshold and risk zone.
AR UI:
Total AR | Current | 1–30 | 31–60 | 61–90 | 90+

High-risk table:
Customer | Amount | Days | Risk | Expected Collection | Cash Impact

165. Performance & Forecast Page
Sections:
Revenue overview
Actual vs Budget vs Forecast
Growth analysis
Customer concentration
Customer profitability
Product profitability
Regional/business-unit performance
Forecast accuracy
Dimensions are shown only when the underlying data exists and the user is authorized to see them.
Forecast charts must distinguish actual, forecast, confidence interval and budget.
166. Financial Explorer
Operational detail page with tabs:
Sales Orders | Invoices | Payments | Customers | Suppliers | Products | Expenses | Transactions | Inventory

Each tab supports search, filters, sorting, column visibility, pagination, row hover, detail drawer and authorized export.
Example:
[Search...] [Status ▼] [Customer ▼] [Date ▼]

SO #   Customer   Amount   Date      Status
10293  ABC Corp   $82K     Aug 20    Shipped
10294  XYZ Ltd    $41K     Aug 20    Delayed
10295  Acme       $28K     Aug 21    Processing

167. Entity Detail / Relationship Drill-Down
Use one reusable detail layout for orders, invoices, customers, payments, products and other canonical entities.
Example Sales Order:
Sales Order #10293
ABC Corp | $82,000 | Shipped

Overview
Order date | Delivery | Sales owner | Business unit | Region

Financial Impact
Revenue | Gross margin | Cash impact | Invoice status | Payment status

Related
Customer | Invoice | Payments | Products

Timeline
Created → Approved → Shipped → Invoiced → Paid

Relationships must be clickable:
Sales Order → Customer → Invoice → Payment → Cash Impact

168. AI CFO UI
AI CFO is a structured decision workspace, not a conventional chat screen.
AI CFO
Ask anything about your business
[Can we afford to hire 10 engineers?]

Suggested:
Why did margin decrease?
What is driving the cash risk?
Which customers are becoming risky?
What if revenue drops 15%?

Responses must use structured blocks:
SHORT ANSWER
KEY NUMBERS
WHY
RISK
RECOMMENDED ACTION
EVIDENCE
[Run Scenario]

Numbers come from deterministic financial tools; the model explains them.
169. Contextual AI and Evidence Drawer
From any metric, risk or entity, the user can ask WealthTwin about the current context.
The Evidence Drawer should show:
Why is cash at risk?

Evidence
• AR overdue: $620K
• DSO: 63 days
• Upcoming payroll: $280K
• Minimum cash threshold: $500K

Sources: ERP, CRM, Bank
Last updated: 9:42 AM

Clearly distinguish verified metric, forecast, AI interpretation, user assumption and scenario result.
170. Intelligence Center
Primary tabs:
Detected | Predicted | Recommended

Card:
HIGH
Cash-flow risk
Projected cash falls below safety threshold in 47 days.
Impact: $240K
Confidence: 87%
[Investigate] [Run Scenario] [Dismiss]

The Intelligence Center replaces a simple notification list with an explanation/action workflow.
171. Decision Simulator
Signature hackathon interaction:
┌──────────────────────────────┬──────────────────────────────┐
│ CURRENT STATE                │ SCENARIO                     │
│ Revenue $4.2M                │ Revenue -15%                 │
│ Profit  $620K                │ Hiring +10                   │
│ Cash    $1.12M               │ Costs +5%                    │
│ Runway  7.8 mo               │ [Run Simulation]             │
└──────────────────────────────┴──────────────────────────────┘

RESULT
Revenue $4.2M → $3.57M
Profit  $620K → $410K
Cash    $1.12M → $760K
Runway  7.8mo → 5.2mo
Risk    Medium → High

[Explain Impact with AI]

Use sliders/toggles/number inputs where appropriate. Every changed assumption must be visible.
172. Control Center UX
Control Center navigation:
Overview
Data Sources
Sync Health
Field Mapping
Metrics
Dashboards
Alerts
Users
Roles & Permissions
Data Scopes
AI Policies
Audit Logs
Configuration Versions

172.1 Overview
Show organization health, source health, mapping issues, active alerts, user count and pending configuration changes.
172.2 Data Sources
Each connector card:
Salesforce
● Connected
Last sync: 9:42 AM
Next sync: 9:57 AM
Records: 1,842,921
Errors: 12
Sync mode: Webhook + Incremental
[Manage] [Sync Now] [History]

172.3 Sync Health
Show source status, freshness, records processed, failures, current jobs and history. Active synchronization must show progress and must be safe to leave running in the background.
172.4 Field Mapping
Side-by-side source/target mapping:
invoice_total  → Invoice.amount   98%
invoice_date   → Invoice.date     99%
customer_name  → Customer.name    96%

Actions: Approve, Reject, Edit, Remap, Preview, Samples, Validation.
Financial mappings are never silently approved.
172.5 Metric Builder
Wizard:
Basic Info → Source → Calculation → Filters → Comparison → Threshold → Visibility → Preview → Publish

Do not allow arbitrary SQL/Python. Use controlled configuration.
172.6 Dashboard Builder
Use a visual drag/drop canvas with widget palette and configuration drawer.
Admin can add, remove, resize, reorder, configure, assign persona, assign visibility, preview and publish/rollback.
172.7 Access Management
Permissions must be hierarchical:
Role
 ├─ Pages/Tabs
 ├─ Features
 ├─ Dashboards
 ├─ Widgets
 ├─ Metrics
 ├─ Fields
 ├─ Data Scope
 ├─ AI Capabilities
 └─ Export/Actions

172.8 Preview as User
Admin selects a user/role and previews exactly what that user sees. This is essential for validating dynamic permissions.
173. Global UI States
Every data-driven component must define:
Loading
Loaded
Empty
Partial
Stale
Error
Unauthorized

Loading uses skeletons. Empty states explain the next action. Errors explain what happened and whether existing data remains safe. Unauthorized states do not leak hidden data.
174. Responsive Design
Desktop is the primary executive experience. Support 1440+, 1280, 1024, 768 and mobile widths.
At smaller widths:
Sidebar becomes drawer
KPI grids stack
Charts stack vertically
Tables become horizontally scrollable or card/list layouts
Filters become a filter sheet
Important alerts remain prominent
AI entry remains accessible
Do not require browser zoom-out to understand the dashboard.
175. Visual Design Language
The visual language must communicate:
Premium | Trustworthy | Calm | Intelligent | Modern | Executive

Avoid excessive gradients, neon AI aesthetics, gaming UI, excessive glassmorphism, decorative charts, or spreadsheet density.
Use restrained surfaces, whitespace, strong alignment and clear hierarchy.
Color is semantic:
Positive = healthy/improving
Warning = attention
Critical = material risk
Neutral = information
Forecast = projection
Actual = actual/current
AI = intelligence/context

Never rely on color alone; pair statuses with labels/icons.
176. Typography, Spacing and Cards
Use a modern professional sans-serif and a consistent spacing scale.
Large financial values are visually dominant. Secondary metadata such as freshness should be visually quieter.
Use cards to group related information, not to turn every tiny metric into an isolated tile.
177. Charts and Tables
Every chart must answer a business question and contain a clear title, unit, time range, tooltip, legend where necessary, actual/forecast distinction and drill-down when useful.
Tables require sticky headers, sort, search, filters, column visibility, pagination, keyboard access, detail drawer and permission-aware fields.
178. Drill-Down Pattern
Standard navigation:
KPI → Chart → Dimension → Entity → Transaction

Example:
Revenue → Customer Revenue → ABC Corp → Sales Orders → Invoice → Payment

Preserve the user's filters when navigating back.
179. Frontend Route Structure
Recommended conceptual routes:
/app
  /command-center
  /financial-health
  /cash
  /performance
  /explorer
    /sales-orders
    /invoices
    /payments
    /customers
    /suppliers
    /products
    /expenses
    /transactions
    /inventory
  /ai-cfo
  /intelligence
  /scenarios
  /integrations
  /control-center
    /overview
    /data-sources
    /sync-health
    /mappings
    /metrics
    /dashboards
    /alerts
    /users
    /roles
    /permissions
    /data-scopes
    /ai-policies
    /audit-logs
    /versions
  /settings

All routes are protected by the centralized permission engine.
180. Frontend Component Hierarchy
AppShell
├── Sidebar
├── TopBar
│   ├── Breadcrumb
│   ├── DateRangePicker
│   ├── GlobalFilters
│   ├── FreshnessIndicator
│   ├── CommandBar
│   ├── NotificationCenter
│   └── UserMenu
└── Page
    ├── PageHeader
    ├── KPIGrid
    ├── FinancialHealthCard
    ├── ChartSection
    ├── AttentionSection
    ├── IntelligenceSection
    └── AiBrief

Reusable components include KpiCard, TrendCard, FinancialHealthCard, RiskCard, AlertCard, ForecastChart, ComparisonChart, DataTable, MetricDetailDrawer, DrillDownPanel, AiBrief, AiChat, ScenarioSimulator, PermissionGate, DataScopeBadge, FreshnessIndicator and SyncStatus.
181. Frontend Performance and Accessibility
Use progressive rendering, lazy loading for low-priority content, caching, server-side pagination, table virtualization for very large datasets, debounced search/filtering and stable chart rendering.
Support keyboard navigation, visible focus, semantic HTML, accessible labels, adequate contrast, non-color status indicators, accessible drawers/modals and reduced-motion preferences.
182. Hackathon Demo Mode
The demo should tell one continuous story:
Connect/Upload Data
      ↓
AI Schema Mapping
      ↓
Financial Digital Twin
      ↓
Executive Command Center
      ↓
Risk Detected
      ↓
Why?
      ↓
13-Week Cash Forecast
      ↓
AI Explanation
      ↓
Recommended Action
      ↓
Decision Simulator
      ↓
Scenario Result
      ↓
Executive Decision

Synthetic/demo data must be explicitly labeled as demo data.
183. Final UI Principle
WealthTwin must not feel like:
ERP + another dashboard + chatbot

It should feel like:
Data
  ↓
Financial Digital Twin
  ↓
Executive Signal
  ↓
Explanation
  ↓
Forecast
  ↓
Recommendation
  ↓
Scenario
  ↓
Decision

The user should leave the Command Center thinking:
"WealthTwin already understands my business and is showing me what matters."
215. Repository and Codebase Architecture
WealthTwin will use separate frontend and backend repositories. This is an explicit architectural requirement and must be preserved by the coding agent.
215.1 Repository Structure
Recommended MVP repository structure:
WealthTwin GitHub Organization
│
├── wealthtwin-frontend
│   ├── Next.js
│   ├── TypeScript
│   ├── Tailwind CSS
│   ├── UI component library
│   ├── Charts
│   ├── API client
│   ├── Client-side state
│   └── Frontend tests
│
└── wealthtwin-backend
    ├── FastAPI
    ├── Python
    ├── PostgreSQL integration
    ├── Redis integration
    ├── Celery/background workers
    ├── Authentication & authorization
    ├── Connector framework
    ├── Data ingestion
    ├── Synchronization engine
    ├── Financial intelligence engine
    ├── AI/LLM gateway
    └── Backend tests
A third repository may be introduced later:
wealthtwin-contracts
for shared API contracts and schemas.

216. Frontend/Backend Boundary
The frontend and backend must have a strict API boundary.
┌─────────────────────────────┐
│    wealthtwin-frontend      │
│                             │
│ Next.js + TypeScript        │
│ CEO/CFO UI                  │
└──────────────┬──────────────┘
               │
               │ HTTPS / REST / JSON
               ▼
┌─────────────────────────────┐
│     wealthtwin-backend      │
│                             │
│ FastAPI + Python            │
│ Business logic              │
│ Financial intelligence      │
│ Integrations                │
│ AI Gateway                  │
└─────────────────────────────┘
The frontend must never directly access PostgreSQL, Redis, CRM APIs, ERP APIs, bank APIs, object-storage credentials, Qwen/LLM provider credentials, or internal service credentials. All such access is mediated by the backend.

217. Repository Responsibilities
Frontend — wealthtwin-frontend
Responsible for CEO/CFO dashboards, Financial Health, Cash & Working Capital, Performance & Forecast, Financial Explorer, AI CFO, Intelligence Center, Scenario Simulator, Control Center, Settings, notifications, routing, responsive UI, charts, tables, forms, UI state, API consumption, accessibility and frontend tests.
The frontend must not contain authoritative financial calculations such as Financial Health Score, Cash Runway, Risk Score or Forecast.
Backend — wealthtwin-backend
Responsible for API, authentication, authorization/RBAC, tenant management, connector framework, ingestion, synchronization, canonical data model, financial metrics, forecasting, risk detection, recommendations, AI gateway, notifications, audit logging and background workers.

218. Shared API Contract
Frontend/backend communication must use a versioned API contract such as:
/api/v1/...
Examples:
GET  /api/v1/dashboard/command-center
GET  /api/v1/financial-health
GET  /api/v1/cash/forecast
GET  /api/v1/intelligence
GET  /api/v1/notifications
GET  /api/v1/explorer/sales-orders
GET  /api/v1/customers/{customer_id}
POST /api/v1/ai/ask
The backend should expose OpenAPI. The frontend API client should be strongly typed/generated from the contract where practical.

219. Optional Third Repository — Contracts
As WealthTwin matures, introduce wealthtwin-contracts for OpenAPI definitions, request/response schemas, enums, event schemas and webhook schemas.
                ┌────────────────────────┐
                 │ wealthtwin-contracts   │
                 │ OpenAPI / Schemas      │
                 └───────────┬────────────┘
                             │
                 ┌───────────┴────────────┐
                 ▼                        ▼
       wealthtwin-frontend      wealthtwin-backend
This is optional for the hackathon MVP and should not add unnecessary complexity.

220. AI and Worker Boundaries
The AI system should initially remain inside the backend behind an AI Gateway:
Frontend → Backend API → AI Gateway → Approved AI/SLM Provider
The frontend must never contain Qwen API keys or model-provider secrets.
Long-running work such as CRM/ERP/bank initial syncs, large CSV processing, reconciliation, metric recalculation, forecast generation and batch AI work must run asynchronously through the backend queue/worker architecture.
Backend API → Queue → Celery Worker → Task

221. Environment and CI/CD Separation
Both repositories should support local, development, staging and production environments.
Frontend receives only frontend-safe environment variables. Backend holds database, Redis, encryption, provider and integration secrets. Secrets must never be committed.
Frontend CI/CD:
Install → Lint → Type Check → Tests → Build → Deploy
Backend CI/CD:
Install → Lint → Type Check → Unit Tests → Integration Tests → Migration Validation → Build → Deploy
A frontend-only change should not require a backend release when the API contract is unchanged, and vice versa.

222. Database and Multi-Tenant Ownership
PostgreSQL belongs exclusively to the backend. The frontend must never connect directly to the database.
Every tenant-owned backend entity must preserve a tenant boundary such as tenant_id. Server-side authorization must enforce tenant, role, feature, field and data-scope permissions. Hiding UI elements is never sufficient authorization.

223. Hackathon MVP vs Startup Evolution
For the hackathon MVP:
wealthtwin-frontend
wealthtwin-backend
Use a modular backend rather than prematurely splitting into microservices.
Frontend
  ↓
FastAPI
  ↓
PostgreSQL + Redis + Celery + Object Storage
  ↓
AI Gateway + Connector Framework
As WealthTwin grows, independently deployable services such as Connector, Sync, Financial Intelligence, AI/SLM and Notification services may be introduced when justified by scale, reliability, security or team ownership.
Do not create microservices merely for architectural aesthetics during the hackathon.

224. Official Codebase Principle
Frontend is responsible for presentation and interaction. Backend is responsible for authoritative business logic, financial calculations, data access, integrations, security, synchronization and AI orchestration.
The two codebases communicate through documented, versioned APIs. The frontend must never bypass the backend to access protected resources.

225. Recommended Final Repository Architecture
                        WEALTHTWIN
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
┌────────────────────────┐      ┌────────────────────────┐
│ wealthtwin-frontend    │      │ wealthtwin-backend     │
│                        │      │                        │
│ Next.js                │      │ FastAPI                │
│ TypeScript             │      │ Python                 │
│ Tailwind               │      │ PostgreSQL             │
│ UI Components          │      │ Redis                  │
│ Charts                 │      │ Celery                 │
│ API Client             │      │ Connectors             │
│ CEO/CFO Experience     │      │ Sync Engine            │
│ Control Center         │      │ Financial Engine       │
│                        │      │ AI Gateway             │
└───────────┬────────────┘      └────────────┬───────────┘
            │                                │
            │          HTTPS / REST          │
            └────────────────────────────────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          │                  │                  │
                          ▼                  ▼                  ▼
                       CRM / ERP            Bank             CSV
Optional future:
                   wealthtwin-contracts
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
             Frontend           Backend
This repository architecture is the official implementation direction for WealthTwin

231. Authentication, Identity & Access Management Architecture

Authentication is a foundational component of WealthTwin.

WealthTwin is an enterprise financial intelligence platform handling highly sensitive business and financial information. Authentication must therefore be designed as a first-class security subsystem rather than as a simple login form.

The authentication architecture must support:

User registration
Login
Logout
Email verification
Password reset
Password change
Session management
Access-token management
Refresh-token management
Multi-factor authentication
OAuth/social/enterprise authentication where enabled
Organization/tenant membership
User invitations
Role-based access control
Permission-based access control
Data-level access control
Session revocation
Account deactivation
Audit logging
Login/security event tracking
Rate limiting
Brute-force protection
Secure credential storage
Secure integration credential handling

The authentication system must be implemented in the backend and consumed through authenticated APIs by the frontend.

232. Authentication Architecture

The authentication architecture is:

┌─────────────────────────────┐
│     WealthTwin Frontend     │
│        Next.js              │
└──────────────┬──────────────┘
               │
               │ HTTPS
               ▼
┌─────────────────────────────┐
│       Authentication API    │
│          FastAPI            │
└──────────────┬──────────────┘
               │
       ┌───────┼────────┐
       │       │        │
       ▼       ▼        ▼
    Users    Sessions   MFA
       │       │
       └───────┼────────┘
               ▼
        Authorization
               │
       ┌───────┼───────────────┐
       ▼       ▼               ▼
     RBAC   Data Scopes   Feature Access
       │       │               │
       └───────┼───────────────┘
               ▼
        Protected APIs

The frontend is responsible for presenting authentication screens and maintaining authentication UI state.

The backend is responsible for:

Verifying credentials
Issuing/revoking sessions
Validating tokens
Enforcing authorization
Enforcing tenant isolation
Enforcing permissions
Logging authentication events

The frontend must never be treated as the security boundary.

233. Authentication Repository Ownership

Authentication logic is split between the two repositories.

Frontend

wealthtwin-frontend contains:

/auth
/login
/register
/verify-email
/forgot-password
/reset-password
/mfa
/invite
/auth/callback

Frontend responsibilities:

Authentication forms
Validation UX
Loading states
Error states
Authentication redirects
Session-aware UI
Protected routes
Unauthorized pages
Logout interaction
Backend

wealthtwin-backend contains:

auth/
├── authentication
├── sessions
├── passwords
├── mfa
├── oauth
├── invitations
├── authorization
├── roles
├── permissions
└── security_events

Backend responsibilities:

Credential verification
Password hashing
Session creation
Token issuance
Token validation
Refresh token rotation
Session revocation
MFA verification
Authorization
Tenant isolation
Security event logging
234. Authentication Pages — Complete UI Map

WealthTwin must have the following authentication-related screens:

1. Welcome / Landing
2. Login
3. Register
4. Email Verification
5. Verification Success
6. Forgot Password
7. Reset Password
8. Reset Password Success
9. MFA Setup
10. MFA Verification
11. MFA Recovery
12. Accept Invitation
13. Create Organization
14. Organization Setup
15. OAuth Callback
16. Session Expired
17. Account Deactivated
18. Unauthorized / Access Denied
19. Security Settings
20. Active Sessions
21. Change Password
22. Re-authentication

Not all screens need to be separate URLs if the implementation uses reusable authentication flows, but every state must be supported.

235. Authentication Design Language

Authentication pages should use the same WealthTwin visual identity as the main application.

The experience should feel:

Premium
Professional
Secure
Minimal
Trustworthy
Enterprise-grade

Do not make authentication pages look like a generic developer application.

Avoid:

Excessive illustrations
Gaming aesthetics
Neon colors
Overly complicated forms
Excessive marketing content

The financial nature of WealthTwin requires trust.

236. Authentication Page Layout

Desktop:

┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                         WEALTHTWIN                                 │
│                                                                    │
│                  Financial Intelligence                            │
│                  for your business                                 │
│                                                                    │
│              ┌──────────────────────────────┐                      │
│              │                              │                      │
│              │        Welcome back          │                      │
│              │                              │                      │
│              │  Work email                 │                      │
│              │  [_______________________]  │                      │
│              │                              │                      │
│              │  Password                   │                      │
│              │  [_______________________]  │                      │
│              │                              │                      │
│              │  [ ] Remember this device   │                      │
│              │                              │                      │
│              │       Forgot password?       │                      │
│              │                              │                      │
│              │  [       Sign In          ]  │                      │
│              │                              │                      │
│              │  ───────── OR ─────────      │                      │
│              │                              │                      │
│              │  [ Continue with Google ]    │                      │
│              │  [ Continue with Microsoft ] │                      │
│              │                              │                      │
│              │  Don't have an account?      │                      │
│              │  Create account              │                      │
│              │                              │                      │
│              └──────────────────────────────┘                      │
│                                                                    │
│                 Secure • Private • Enterprise                     │
└────────────────────────────────────────────────────────────────────┘

The exact marketing copy may change, but the layout should remain minimal.

237. Login Page

Route:

/login

Purpose:

Authenticate an existing user.

Fields:

Work Email
Password

Optional:

Remember this device

Actions:

Sign In
Forgot Password?
Continue with Google
Continue with Microsoft
Create Account

For enterprise deployments, optionally:

Continue with SSO

The SSO option should only appear when configured for the organization.

238. Login Field Requirements
Email

Input type:

email

Validation:

Required
Valid email syntax
Trim whitespace
Normalize casing where appropriate

Error:

Enter a valid work email address.

Do not expose whether an email belongs to an existing account during password-reset or account-recovery flows.

239. Password Field

Input:

type="password"

Features:

Show password
Hide password

Do not permanently display the password.

The frontend should not log password values.

The password must be transmitted only over HTTPS.

240. Login Loading State

When the user submits:

[ Signing in... ]

The button becomes disabled.

Prevent multiple simultaneous login requests.

The rest of the form should remain visually stable.

241. Login Error States

Incorrect credentials should return a generic message:

Email or password is incorrect.

Do not expose:

Email does not exist.

or:

Password is wrong.

because this enables account enumeration.

For rate limiting:

Too many sign-in attempts.

Please wait before trying again.

For deactivated account:

This account has been deactivated.

Contact your organization administrator.

For unverified account:

Please verify your email before continuing.

[Resend Verification Email]
242. Registration Page

Route:

/register

The registration flow should collect the minimum information required to create an account.

Fields:

First Name
Last Name
Work Email
Password
Confirm Password

Optional during registration:

Company / Organization Name

If the user joins through an invitation, organization information should be pre-populated and not unnecessarily editable.

243. Registration UI
Create your WealthTwin account

First name
[________________]

Last name
[________________]

Work email
[________________]

Password
[________________]

Confirm password
[________________]

☐ I agree to the Terms of Service and Privacy Policy

[Create Account]

Already have an account?
Sign in

The terms checkbox must be explicitly required.

244. Password Strength Indicator

Registration must display password requirements before submission.

Example:

Password strength

✓ At least 12 characters
✓ Uppercase letter
✓ Lowercase letter
✓ Number
✓ Special character

The implementation should preferably use a password strength estimator in addition to static requirements.

Do not reveal passwords in logs or telemetry.

245. Registration Success

After successful registration:

Check your email

We've sent a verification link to:

s***@company.com

Verify your email to continue.

[Resend Email]

Didn't receive it?
Check your spam folder.

The user should not automatically receive full application access until the required verification policy is satisfied.

246. Email Verification

Route:

/verify-email

The verification URL should contain a short-lived, single-use verification token.

Flow:

Registration
     ↓
Verification email
     ↓
User clicks link
     ↓
Backend validates token
     ↓
Email verified
     ↓
Account activated
     ↓
Redirect

Success:

Email verified successfully.

Your WealthTwin account is ready.

[Continue]
247. Verification Failure

Expired token:

This verification link has expired.

[Send New Verification Email]

Already used:

This email has already been verified.

[Continue to WealthTwin]

Invalid:

This verification link is invalid.

[Request New Link]
248. Forgot Password Page

Route:

/forgot-password

UI:

Forgot your password?

Enter your work email and we'll send you a
secure password reset link.

Work email
[________________]

[Send Reset Link]

Back to Sign In

For security, always show a neutral success response:

If an account exists for this email, we've sent
instructions to reset the password.

Do not reveal account existence.

249. Password Reset

Route:

/reset-password

Fields:

New Password
Confirm New Password

Show password requirements.

Submit:

[Reset Password]

The reset token must be:

Short-lived
Single-use
Cryptographically secure
Invalidated after successful reset
250. Reset Success
Password reset successfully.

Your password has been updated.

For your security, other active sessions may have
been signed out.

[Sign In]

The exact session-revocation policy should be configurable but should default toward security.

251. Multi-Factor Authentication

MFA should be supported for WealthTwin.

Recommended initial methods:

Authenticator App / TOTP
Recovery Codes

Future enterprise options:

WebAuthn / Passkeys
Security Keys
Enterprise SSO

SMS should not be the preferred MFA mechanism for a security-sensitive financial platform.

252. MFA Setup Page

Route:

/settings/security/mfa

UI:

Protect your account

Add an authenticator app

1. Open your authenticator app.
2. Scan the QR code.
3. Enter the 6-digit code.

┌──────────────────┐
│                  │
│      QR CODE     │
│                  │
└──────────────────┘

Can't scan?

[Show setup key]

Verification code
[ _ _ _ _ _ _ ]

[Verify & Enable]
253. MFA Recovery Codes

After enabling MFA:

Save your recovery codes

These codes can be used if you lose access
to your authenticator.

XXXX-XXXX
XXXX-XXXX
XXXX-XXXX
...

Actions:

[Download Codes]
[Copy Codes]
[I Have Saved Them]

Recovery codes must be shown only at the appropriate secure point and stored securely by the backend in a form suitable for verification.

254. MFA Login Screen

After valid password:

Two-factor authentication

Enter the 6-digit code from your authenticator app.

[ _ _ _ _ _ _ ]

[Verify]

Use a recovery code

The page should show:

Signed in as:
s***@company.com

Do not display unnecessary sensitive information.

255. MFA Failure

Invalid code:

That code is incorrect.

Try again.

Repeated failures should be rate-limited.

Do not reveal whether the account's MFA configuration exists beyond what is necessary for the authenticated flow.

256. Invitation Flow

WealthTwin organizations need controlled user onboarding.

Admin:

Control Center
 → Users
 → Invite User

Invitation fields:

Email
Role
Data Scope
Optional Message

Example:

Invite User

Email:
john@company.com

Role:
Finance Manager

Data Scope:
North America

[Send Invitation]
257. Invitation Email

Email should contain:

You've been invited to WealthTwin

Company:
Acme Corporation

Invited by:
Sarah Khan

Role:
Finance Manager

[Accept Invitation]

Invitation tokens must be:

Short-lived
Single-use
Secure
Revocable
258. Accept Invitation Page

Route:

/invite/accept

If the user already has an account:

You've been invited to join:

Acme Corporation

Role:
Finance Manager

[Accept Invitation]

If the user doesn't have an account:

Create your account to join:

Acme Corporation

First name
Last name
Password

[Create Account & Join]

The organization should be determined from the invitation token rather than freely chosen by the user.

259. Organization Creation

After a standalone registration, the user may create an organization if they are permitted to do so.

Screen:

Set up your organization

Company name
[________________]

Industry
[________________]

Country
[________________]

Base currency
[USD ▼]

Fiscal year
[January – December ▼]

[Create Organization]

The user who creates the organization becomes the initial organization administrator/owner according to the platform's tenant policy.

260. Organization Onboarding

After organization creation:

Welcome to WealthTwin

Let's build your Financial Digital Twin.

Step 1
Connect your data

[Connect CRM]
[Connect ERP]
[Connect Bank]
[Upload CSV]

Step 2
Choose your role

[CEO]
[CFO]
[Finance]
[Other]

Step 3
Configure your dashboard

[Continue]

The onboarding flow should be skippable where appropriate, but users should understand that WealthTwin's intelligence improves once data is connected.

261. OAuth Authentication

For supported providers:

Continue with Google
Continue with Microsoft
Enterprise SSO

The OAuth flow must use backend-controlled OAuth handling.

Architecture:

Frontend
   ↓
GET /auth/oauth/{provider}/start
   ↓
Backend
   ↓
Provider
   ↓
OAuth Callback
   ↓
Backend
   ↓
Create/Update Session
   ↓
Frontend

OAuth client secrets must remain exclusively on the backend.

262. OAuth Account Linking

A user may be able to link additional authentication methods from:

Settings
 → Security
 → Connected Login Methods

Example:

Email & Password       Connected
Google                  Connected
Microsoft               Not connected
Authenticator           Enabled

Dangerous account-linking operations should require re-authentication.

263. Session Architecture

WealthTwin should use secure server-controlled sessions/tokens.

Recommended conceptual model:

Short-lived Access Token
+
Rotating Refresh Token / Secure Session

Access tokens should have a relatively short lifetime.

Refresh/session credentials must be securely stored.

For browser applications, prefer secure, HttpOnly, Secure cookies for long-lived session/refresh credentials rather than exposing long-lived tokens to JavaScript.

Exact implementation may depend on the selected authentication provider/framework.

264. Session Lifecycle
Login
  ↓
Credentials verified
  ↓
MFA if required
  ↓
Session created
  ↓
Access token/session issued
  ↓
API requests
  ↓
Access expires
  ↓
Refresh/renew
  ↓
Continue

If refresh fails:

Session expired
     ↓
Redirect to login
265. Session Expired UI
Your session has expired.

For your security, please sign in again.

[Sign In]

Do not silently lose unsaved user work where possible.

Forms and dashboard configuration changes should warn the user before losing state.

266. Active Sessions Page

Route:

/settings/security/sessions

Display:

Active Sessions

Chrome · Windows
Karachi, Pakistan
Current session
Last active: 2 minutes ago

Edge · Windows
Last active: 3 days ago

Chrome · macOS
Last active: 8 days ago

Actions:

[Sign Out Other Sessions]
[Revoke]

The exact location information shown should be privacy-conscious and based only on information actually available.

267. Logout

Logout must invalidate the appropriate server-side session/refresh credential.

Flow:

User clicks Logout
      ↓
Frontend calls logout API
      ↓
Backend invalidates session
      ↓
Cookies/tokens cleared
      ↓
Frontend state cleared
      ↓
Redirect /login

Logout must not simply mean deleting a local frontend variable.

268. Re-Authentication

Sensitive operations should be able to require recent authentication.

Examples:

Change password
Disable MFA
View/reveal sensitive integration credentials
Change security settings
Change organization owner
Delete organization
Regenerate recovery codes

UI:

Confirm your identity

For your security, please enter your password
to continue.

Password
[________________]

[Continue]

MFA may also be required.

269. Password Change Page

Route:

/settings/security/password

Fields:

Current Password
New Password
Confirm New Password

Requirements:

Current password required
New password must satisfy policy
New password must differ appropriately

After success:

Password changed successfully.

Depending on policy:

Other sessions have been signed out.
270. Account Deactivation UI

If an account is disabled:

Account unavailable

Your WealthTwin account has been deactivated.

Please contact your organization administrator.

Do not expose internal security reasons.

271. Unauthorized UI

Route:

/403

Example:

You don't have access to this page.

Your role or data permissions do not allow access
to this resource.

[Return to Command Center]

Do not simply hide all unauthorized errors as "not found" if the user needs to understand that access is restricted.

The backend remains authoritative.

272. Authentication Middleware — Frontend

Frontend route protection should provide a good user experience.

Conceptually:

Protected Route
      ↓
Check authentication state
      ↓
Authenticated?
   /          \
 No            Yes
 ↓              ↓
/login       Render Page

If a user attempts:

/financial-health

while unauthenticated:

→ /login?returnTo=/financial-health

After successful authentication:

→ /financial-health

Do not permit arbitrary unsafe redirect URLs.

273. Backend Authentication Middleware

Every protected API request should pass through:

Request
 ↓
Extract session/token
 ↓
Validate
 ↓
Identify user
 ↓
Identify tenant
 ↓
Check account status
 ↓
Check session status
 ↓
Authorization
 ↓
Data scope
 ↓
Endpoint

Conceptually:

current_user = authenticate(request)
tenant = resolve_tenant(current_user)
authorize(current_user, endpoint)
scope = resolve_data_scope(current_user)

The exact implementation is left to the backend framework, but these responsibilities are mandatory.

274. Authorization Model

Authentication answers:

Who are you?

Authorization answers:

What are you allowed to do?

WealthTwin must implement both.

Example:

User:
Sarah

Role:
CFO

Permissions:
view_financials
view_cash
view_forecasts
run_scenarios
view_ai_cfo
export_financial_data

Data Scope:
All entities

Another user:

User:
John

Role:
Finance Manager

Permissions:
view_financials
view_ar
view_ap

Data Scope:
North America
275. Role-Based Access Control

Initial built-in roles:

Organization Owner
Administrator
CEO
CFO
Finance Manager
Finance Analyst
Manager
Viewer

The exact roles should be configurable.

Roles should be collections of permissions rather than hardcoded frontend conditions.

Avoid:

if (user.role === "CFO") {
   showCashDashboard();
}

Prefer permission-based logic:

can_view_cash_dashboard

This allows custom roles.

276. Permission Categories

Permissions should be grouped.

Dashboard Permissions
Metric Permissions
Data Permissions
Feature Permissions
Administrative Permissions
AI Permissions
Integration Permissions
Export Permissions
Security Permissions

Examples:

dashboard.command_center.view
dashboard.cash.view

metric.revenue.view
metric.cash.view

data.invoices.view
data.customers.view

feature.scenario_simulator.use
feature.ai_cfo.use

admin.users.manage
admin.roles.manage

integration.manage

export.financial_data

security.manage_mfa
277. Data-Level Authorization

Access control must extend beyond pages.

Example:

User can access:

Financial Explorer

but only:

Region = Pakistan

The backend must enforce:

WHERE region IN user's_allowed_regions

or the equivalent authorization mechanism.

The frontend must not fetch all records and hide unauthorized ones.

278. Field-Level Permissions

Some financial fields may be sensitive.

Example:

Customer
├── Name              visible
├── Revenue            visible
├── Outstanding        visible
├── Credit Limit       restricted
├── Bank Details       restricted
└── Internal Notes     restricted

Backend responses must omit unauthorized fields.

Do not send restricted fields to the browser and merely hide them with CSS.

279. Dashboard-Level Permissions

Admin must be able to control dashboard visibility.

Example:

Dashboard:
Cash & Working Capital

Visible to:
☑ CEO
☑ CFO
☑ Finance Manager
☐ Sales Manager
☐ Viewer

The backend must enforce the same permission.

280. Metric-Level Permissions

Admin can configure:

Metric:
EBITDA

Visible:
CEO
CFO
Finance Director

A user without permission must not receive the metric value from the backend.

281. Tab-Level Permissions

Example:

Financial Explorer

Tabs:

Sales Orders       ✓
Invoices           ✓
Payments           ✓
Payroll             ✗
Bank Transactions   ✗

The frontend should hide unauthorized tabs.

The backend must independently enforce endpoint authorization.

282. Feature-Level Permissions

Examples:

AI CFO
Scenario Simulator
Export
Create Alert
Dashboard Builder
Metric Builder
Integration Management

Each should have independent permissions.

283. Permission Resolution

Effective permission should be calculated from:

User
+
Organization
+
Role
+
Custom Permissions
+
Data Scope
+
Feature Configuration

Conceptually:

User
 ↓
Roles
 ↓
Permissions
 ↓
Data Scope
 ↓
Effective Access
284. Tenant Isolation

WealthTwin is a multi-tenant SaaS platform.

Every authenticated request must be associated with a tenant/organization.

User
 ↓
Organization Membership
 ↓
Tenant ID
 ↓
Tenant-scoped data

A user belonging to:

Company A

must never be able to retrieve:

Company B

data by modifying an ID in a URL or request.

Example attack:

GET /api/v1/customers/companyB-customer-id

must be rejected even if the attacker knows the identifier.

285. Organization Membership

A user may belong to multiple organizations in future.

Therefore model:

User
   │
   ├── Membership → Organization A
   │
   └── Membership → Organization B

Each membership contains:

user_id
organization_id
role
status
data_scope
joined_at

The active organization must be explicitly resolved.

286. Organization Switcher UI

If multi-organization membership is supported:

Top bar:

Acme Corporation ▼

Click:

Organizations

✓ Acme Corporation
  Beta Industries
  WealthTwin Demo

[Create Organization]

Switching organizations must:

Refresh permissions
Refresh dashboard data
Refresh tenant context
Clear tenant-specific cached state
Prevent cross-tenant data leakage
287. Security Event Logging

Authentication events must be auditable.

Examples:

LOGIN_SUCCESS
LOGIN_FAILURE
LOGOUT
PASSWORD_CHANGED
PASSWORD_RESET_REQUESTED
PASSWORD_RESET_COMPLETED
EMAIL_VERIFIED
MFA_ENABLED
MFA_DISABLED
MFA_FAILED
SESSION_CREATED
SESSION_REVOKED
INVITATION_SENT
INVITATION_ACCEPTED
ROLE_CHANGED
PERMISSION_CHANGED
ORGANIZATION_SWITCHED
ACCOUNT_DEACTIVATED

Each event should record appropriate metadata:

event_id
user_id
organization_id
event_type
timestamp
IP metadata where appropriate
user_agent metadata where appropriate
success/failure
request/session correlation ID

Do not log passwords, tokens, API keys, or secrets.

288. Authentication Rate Limiting

Rate limit sensitive endpoints:

/login
/register
/forgot-password
/reset-password
/mfa/verify
/oauth

Example conceptual policy:

Repeated failed login attempts
        ↓
Rate limit
        ↓
Temporary protection

The exact thresholds should be configurable and should avoid unnecessarily locking out legitimate users.

289. CSRF Protection

If browser authentication uses cookies, implement appropriate CSRF protection for state-changing operations.

State-changing requests include:

POST
PUT
PATCH
DELETE

The exact implementation should follow the chosen authentication/session framework.

Do not assume that HttpOnly cookies alone eliminate CSRF risk.

290. XSS Protection

Authentication UI must follow secure frontend practices.

Never inject unsanitized user-controlled HTML.

Do not render:

user.name
organization.name
error.message

as raw HTML.

All user-generated content must be safely rendered.

291. Credential Security

Passwords must never be stored in plaintext.

Use a modern password hashing algorithm supported by the chosen backend security framework.

Never store:

password
raw password
password confirmation

in logs, analytics, database records, or frontend telemetry.

292. Token Security

Tokens must:

Be cryptographically secure
Have limited lifetime where appropriate
Be scoped appropriately
Be invalidatable where required
Never be logged
Never be embedded in URLs unnecessarily
Never be exposed through frontend error messages

Refresh/session credentials require stronger protection than short-lived access credentials.

293. Integration Credential Security

This is especially important for WealthTwin.

CRM, ERP and bank credentials must not be stored as ordinary application data.

Architecture:

User
 ↓
Connect Salesforce
 ↓
OAuth
 ↓
Provider
 ↓
Backend receives credentials/tokens
 ↓
Encrypted credential storage
 ↓
Connector service

Frontend should never permanently receive provider secrets.

Integration credentials should be encrypted at rest using appropriate key management.

294. Authentication vs Integration Authentication

Do not confuse:

WealthTwin User Authentication

with:

Customer's Salesforce/ERP/Bank Authentication

They are separate security domains.

Example:

Sarah
  ↓
WealthTwin Login
  ↓
Authenticated

Sarah
  ↓
Connect Salesforce
  ↓
Salesforce OAuth
  ↓
Salesforce access granted

The user can remain logged into WealthTwin even if a Salesforce token expires.

The Control Center should clearly communicate the difference.

295. Authentication Security Settings

Settings page:

Settings
 └── Security
      ├── Password
      ├── Two-Factor Authentication
      ├── Active Sessions
      ├── Connected Login Methods
      ├── Recovery
      └── Security Activity
296. Security Activity UI

Example:

Security Activity

Today

Successful sign-in
Chrome · Windows
9:32 PM

MFA verification
Chrome · Windows
9:32 PM

Yesterday

Password changed
10:14 AM

3 days ago

New session
Edge · Windows

Provide enough context for users to identify suspicious activity.

297. Suspicious Login Notification

If security controls detect suspicious activity:

New sign-in detected

A new sign-in was detected for your WealthTwin account.

Device:
Chrome / Windows

Time:
9:32 PM

If this wasn't you:

[Secure My Account]

Avoid exposing unnecessary sensitive location/device information.

298. Account Recovery

Recovery must support:

Forgot Password
MFA Recovery Codes
Organization Administrator Assistance
Enterprise Identity Provider

Support should not be able to casually bypass strong authentication without an auditable process.

299. Authentication API Endpoints

Recommended API structure:

POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout

POST /api/v1/auth/refresh

POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification

POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password

POST /api/v1/auth/change-password

GET  /api/v1/auth/me

POST /api/v1/auth/mfa/setup
POST /api/v1/auth/mfa/enable
POST /api/v1/auth/mfa/verify
POST /api/v1/auth/mfa/disable
POST /api/v1/auth/mfa/recovery-codes/regenerate

GET  /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/{session_id}
POST /api/v1/auth/sessions/revoke-all

GET  /api/v1/auth/oauth/{provider}/start
GET  /api/v1/auth/oauth/{provider}/callback

The exact endpoint naming may evolve, but the capabilities must exist.

300. Authentication Response Model

The frontend should receive a predictable authenticated-user response.

Example:

{
  "user": {
    "id": "user_123",
    "firstName": "Sarah",
    "lastName": "Khan",
    "email": "sarah@company.com",
    "emailVerified": true,
    "mfaEnabled": true
  },
  "organization": {
    "id": "org_123",
    "name": "Acme Corporation"
  },
  "membership": {
    "role": "CFO"
  },
  "permissions": [
    "dashboard.command_center.view",
    "dashboard.cash.view",
    "metric.revenue.view",
    "metric.cash.view",
    "feature.ai_cfo.use",
    "feature.scenario_simulator.use"
  ]
}

Do not return secrets.

301. Authentication UI State Machine

The frontend should model authentication states explicitly.

UNKNOWN
   ↓
CHECKING_SESSION
   ↓
 ┌───────────────┐
 │               │
 ▼               ▼
AUTHENTICATED   UNAUTHENTICATED
 │               │
 ▼               ▼
APPLICATION     LOGIN

Additional states:

EMAIL_UNVERIFIED
MFA_REQUIRED
INVITATION_PENDING
SESSION_EXPIRED
ACCOUNT_DISABLED
PASSWORD_RESET_REQUIRED

This avoids inconsistent redirects and flickering UI.

302. Protected Application Startup

When the application loads:

Application starts
      ↓
Check session
      ↓
Load current user
      ↓
Load active organization
      ↓
Load effective permissions
      ↓
Load navigation configuration
      ↓
Render authorized application

Do not render sensitive dashboard data before authorization state has been resolved.

303. Permission-Aware Navigation

The sidebar must be generated from permissions/configuration.

Example:

User permissions:

command_center.view
cash.view
ai_cfo.view
explorer.invoices.view

Sidebar:

✓ Command Center
✓ Cash
✗ Performance
✓ Financial Explorer
    ✓ Invoices
    ✗ Bank Transactions
✓ AI CFO

The backend must still enforce the same permissions.

304. Authentication Onboarding Flow

Recommended first-time flow:

Register
   ↓
Verify Email
   ↓
Create/Accept Organization
   ↓
Select Role
   ↓
Configure Security
   ↓
Connect Data
   ↓
Configure Dashboard
   ↓
Command Center

For invited users:

Accept Invitation
   ↓
Create/Login Account
   ↓
Verify Email if necessary
   ↓
MFA if required
   ↓
Organization
   ↓
Command Center
305. First Login Experience

After successful first login:

Welcome to WealthTwin, Sarah.

Let's get your Financial Digital Twin ready.

Progress:

① Account
✓

② Organization
✓

③ Security
○

④ Connect Data
○

⑤ Dashboard
○

The onboarding progress should be visible but not overwhelming.

306. Authentication UX Rules

The coding agent must follow these rules:

Never expose whether an account exists during password recovery.
Never expose passwords in logs.
Never expose provider credentials to the frontend.
Never rely on frontend authorization alone.
Never trust a tenant ID supplied by the browser without server-side validation.
Never return unauthorized financial fields and hide them in the UI.
Never store long-lived secrets in localStorage.
Never put sensitive credentials in URLs.
Always use HTTPS in non-local environments.
Always invalidate/revoke sessions appropriately.
Always rate-limit authentication endpoints.
Always audit security-sensitive actions.
Always enforce tenant isolation server-side.
Always use permission-based authorization rather than hardcoded role checks where possible.
Always show clear but non-sensitive authentication errors.
307. Authentication Component Hierarchy

Frontend:

AuthLayout
├── AuthBranding
├── AuthCard
├── LoginForm
├── RegisterForm
├── PasswordInput
├── PasswordStrength
├── EmailVerification
├── ForgotPasswordForm
├── ResetPasswordForm
├── MfaChallenge
├── MfaSetup
├── RecoveryCodes
├── OAuthButtons
├── InvitationCard
├── SessionExpired
└── AuthError

Shared components:

FormField
PasswordField
Button
Alert
Toast
LoadingSpinner
Modal
ConfirmationDialog
308. Authentication Form Validation

Validation should happen at both:

Frontend
+
Backend

Frontend validation exists for UX.

Backend validation exists for security.

Example:

Frontend:
Password too short → immediate feedback

Backend:
Password policy violated → reject request

Never assume frontend validation is sufficient.

309. Authentication Telemetry

Authentication telemetry may record:

Login success/failure
Registration completion
Verification completion
MFA success/failure
Password reset completion
OAuth success/failure
Session expiry

Telemetry must never include:

Passwords
Tokens
Recovery codes
OAuth secrets
Bank credentials
CRM credentials
310. Authentication Audit vs Application Audit

Keep these conceptually distinct.

Authentication/Security Audit
Login
Logout
Password changes
MFA
Session changes
Identity changes
Application Audit
Dashboard changes
Metric changes
Permission changes
Data mappings
Integration changes
AI policy changes

Both should be available to appropriately authorized administrators.

311. Final Authentication Architecture

The complete security flow is:

                         USER
                          │
                          ▼
                 ┌─────────────────┐
                 │ WealthTwin Auth │
                 └────────┬────────┘
                          │
                 Credentials / OAuth
                          │
                          ▼
                    MFA if required
                          │
                          ▼
                     SESSION
                          │
                          ▼
                    USER IDENTITY
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          Tenant         Role       Permissions
             │            │            │
             └────────────┼────────────┘
                          ▼
                    DATA SCOPES
                          │
                          ▼
                 AUTHORIZED API CALL
                          │
                          ▼
                 WEALTHTWIN BACKEND
                          │
              ┌───────────┼────────────┐
              ▼           ▼            ▼
          Financial      AI        Integrations
           Data       Gateway       / Sync
              │           │            │
              └───────────┼────────────┘
                          ▼
                   AUTHORIZED RESULT
                          │
                          ▼
                 WEALTHTWIN FRONTEND

The core security principle is:

Authentication establishes identity. Authorization determines what that identity can access. Tenant isolation determines which organization's data can be accessed. Data scopes determine which subset of that organization's data can be accessed.

This must be enforced by the backend regardless of what the frontend displays.

312. Authentication Implementation Priority
Phase 1 — Hackathon MVP

Implement:

✓ Email/password registration
✓ Login
✓ Logout
✓ Email verification
✓ Forgot password
✓ Reset password
✓ Session management
✓ Organization creation
✓ Organization membership
✓ Basic RBAC
✓ Protected routes
✓ Backend authorization
✓ Tenant isolation
✓ User invitation
✓ Security audit events
Phase 2

Implement:

✓ TOTP MFA
✓ Recovery codes
✓ Active sessions
✓ Session revocation
✓ OAuth Google
✓ OAuth Microsoft
✓ Security activity
Phase 3 — Enterprise

Implement:

✓ SSO
✓ SAML/OIDC
✓ SCIM provisioning
✓ Passkeys/WebAuthn
✓ Advanced identity policies
✓ Enterprise MFA policies
✓ Conditional access
✓ Advanced security monitoring

Do not over-engineer Phase 1 with enterprise identity infrastructure before the core WealthTwin product is working.

313. Coding Agent Authentication Directive

The coding agent must treat this section as authoritative.

The coding agent must not:

Create a basic unprotected login page and consider authentication complete.
Store passwords directly.
Store secrets in frontend code.
Store long-lived authentication tokens insecurely.
Implement authorization only in React/Next.js.
Allow the browser to select arbitrary tenant IDs.
Return restricted financial fields to unauthorized users.
Hardcode CEO/CFO permissions throughout the UI.
Allow direct frontend access to CRM, ERP, bank or database credentials.

The coding agent must implement authentication as a complete subsystem consisting of:

Identity
+
Sessions
+
MFA
+
Tenant Membership
+
RBAC
+
Permissions
+
Data Scopes
+
Security Events
+
Protected APIs
+
Authentication UI

The authentication experience must visually match the premium WealthTwin executive product while maintaining enterprise-grade security.