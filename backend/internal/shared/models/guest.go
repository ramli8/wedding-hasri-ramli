package models

import (
	"time"
)

// GuestCategory represents a category of guests
type GuestCategory struct {
	ID        int        `gorm:"primaryKey;autoIncrement"`
	Name      string     `gorm:"type:varchar(100);not null;uniqueIndex"`
	StartTime *time.Time `gorm:"type:timestamp;default:null"`
	EndTime   *time.Time `gorm:"type:timestamp;default:null"`
	CreatedAt time.Time  `gorm:"not null;default:now()"`
	UpdatedAt time.Time  `gorm:"not null;default:now()"`
}

func (GuestCategory) TableName() string {
	return "guest_categories"
}

// Guest represents an individual guest
type Guest struct {
	ID                string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	GuestCategoryID   int        `gorm:"not null"`
	GuestCategory     GuestCategory `gorm:"foreignKey:GuestCategoryID"`
	QRCode            string     `gorm:"type:varchar(6);not null;uniqueIndex"`
	Name              string     `gorm:"type:varchar(255);not null"`
	PhoneNumber       *string    `gorm:"type:varchar(20);default:null"`
	InstagramUsername *string    `gorm:"type:varchar(50);default:null"`
	Address           *string    `gorm:"type:text;default:null"`
	Note              *string    `gorm:"type:text;default:null"`
	StatusAttending   string     `gorm:"type:guest_status_attending;default:pending"`
	StatusSent        string     `gorm:"type:guest_status_sent;default:pending"`
	CheckInAt         *time.Time `gorm:"type:timestamp;default:null"`
	CheckOutAt        *time.Time `gorm:"type:timestamp;default:null"`
	CreatedAt         time.Time  `gorm:"not null;default:now()"`
	UpdatedAt         time.Time  `gorm:"not null;default:now()"`
	DeletedAt         *time.Time `gorm:"index"`
}

func (Guest) TableName() string {
	return "guests"
}
