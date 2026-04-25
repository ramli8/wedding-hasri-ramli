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
