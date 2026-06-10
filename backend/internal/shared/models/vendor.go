package models

import (
	"time"
)

type VendorCategory struct {
	ID               int        `gorm:"primaryKey;autoIncrement"`
	EventID          string     `gorm:"type:uuid;not null;index:idx_vendor_categories_event_name,unique;index"`
	Name             string     `gorm:"type:varchar(100);not null;index:idx_vendor_categories_event_name,unique"`
	SelectedVendorID *string    `gorm:"type:uuid;default:null"`
	SelectedVendor   *Vendor    `gorm:"foreignKey:SelectedVendorID"`
	Attributes       []VendorCategoryAttribute `gorm:"foreignKey:CategoryID"`
	Vendors          []Vendor  `gorm:"foreignKey:CategoryID"`
	CreatedAt        time.Time `gorm:"not null;default:now()"`
	UpdatedAt        time.Time `gorm:"not null;default:now()"`
}

func (VendorCategory) TableName() string {
	return "vendor_categories"
}

type VendorCategoryAttribute struct {
	ID         int       `gorm:"primaryKey;autoIncrement"`
	CategoryID int       `gorm:"not null;index:idx_vcat_attrs_category_name,unique;index"`
	Category   VendorCategory `gorm:"foreignKey:CategoryID"`
	Name       string    `gorm:"type:varchar(100);not null;index:idx_vcat_attrs_category_name,unique"`
	SortOrder  int       `gorm:"not null;default:0"`
	CreatedAt  time.Time `gorm:"not null;default:now()"`
	UpdatedAt  time.Time `gorm:"not null;default:now()"`
}

func (VendorCategoryAttribute) TableName() string {
	return "vendor_category_attributes"
}

type Vendor struct {
	ID             string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	CategoryID     int        `gorm:"not null;index"`
	Category       VendorCategory `gorm:"foreignKey:CategoryID"`
	Name           string     `gorm:"type:varchar(255);not null"`
	ContactPerson  *string    `gorm:"type:varchar(255);default:null"`
	PhoneNumber    *string    `gorm:"type:varchar(20);default:null"`
	Instagram      *string    `gorm:"type:varchar(50);default:null"`
	Address        *string    `gorm:"type:text;default:null"`
	ReferencePrice *float64   `gorm:"type:decimal(15,2);default:null"`
	ContractAmount *float64   `gorm:"type:decimal(15,2);default:null"`
	PaymentStatus  string     `gorm:"type:vendor_payment_status;default:unpaid"`
	Note           *string    `gorm:"type:text;default:null"`
	CreatedAt      time.Time  `gorm:"not null;default:now()"`
	UpdatedAt      time.Time  `gorm:"not null;default:now()"`
	DeletedAt      *time.Time `gorm:"index"`
	AttributeValues []VendorAttributeValue `gorm:"foreignKey:VendorID"`
	Payments       []VendorPayment        `gorm:"foreignKey:VendorID"`
}

func (Vendor) TableName() string {
	return "vendors"
}

type VendorAttributeValue struct {
	ID          int       `gorm:"primaryKey;autoIncrement"`
	VendorID    string    `gorm:"type:uuid;not null;index:idx_vattr_values_vendor_attribute,unique;index"`
	Vendor      Vendor    `gorm:"foreignKey:VendorID"`
	AttributeID int       `gorm:"not null;index:idx_vattr_values_vendor_attribute,unique;index"`
	Attribute   VendorCategoryAttribute `gorm:"foreignKey:AttributeID"`
	Value       *string   `gorm:"type:text;default:null"`
	CreatedAt   time.Time `gorm:"not null;default:now()"`
	UpdatedAt   time.Time `gorm:"not null;default:now()"`
}

func (VendorAttributeValue) TableName() string {
	return "vendor_attribute_values"
}

type VendorPayment struct {
	ID        int       `gorm:"primaryKey;autoIncrement"`
	VendorID  string    `gorm:"type:uuid;not null;index"`
	Vendor    Vendor    `gorm:"foreignKey:VendorID"`
	Date      time.Time `gorm:"type:date;not null"`
	Amount    float64   `gorm:"type:decimal(15,2);not null"`
	Note      *string   `gorm:"type:text;default:null"`
	CreatedAt time.Time `gorm:"not null;default:now()"`
	UpdatedAt time.Time `gorm:"not null;default:now()"`
}

func (VendorPayment) TableName() string {
	return "vendor_payments"
}
