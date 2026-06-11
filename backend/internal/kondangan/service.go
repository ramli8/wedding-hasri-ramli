package kondangan

import (
	"context"

	"github.com/base-go/backend/internal/shared/models"
)

type Service interface {
	Create(ctx context.Context, req CreateKondanganRequest) (*KondanganResponse, error)
	GetByID(ctx context.Context, id string) (*KondanganResponse, error)
	List(ctx context.Context, req KondanganListRequest) (*KondanganListResponse, error)
	Update(ctx context.Context, id string, req UpdateKondanganRequest) (*KondanganResponse, error)
	Delete(ctx context.Context, id string) error
	GetStats(ctx context.Context) (*KondanganStatsResponse, error)

	// Relations
	CreateRelation(ctx context.Context, req CreateKondanganRelationRequest) (*KondanganRelationResponse, error)
	DeleteRelation(ctx context.Context, id int) error
	ListRelations(ctx context.Context) ([]KondanganRelationResponse, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, req CreateKondanganRequest) (*KondanganResponse, error) {
	kondangan := &models.Kondangan{
		CoupleName: req.CoupleName,
		RelationID: req.RelationID,
		Side:       req.Side,
		GiftType:   req.GiftType,
		GiftName:   req.GiftName,
		Nominal:    req.Nominal,
	}

	if err := s.repo.Create(ctx, kondangan); err != nil {
		return nil, err
	}

	return s.mapToResponse(kondangan), nil
}

func (s *service) GetByID(ctx context.Context, id string) (*KondanganResponse, error) {
	kondangan, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return s.mapToResponse(kondangan), nil
}

func (s *service) List(ctx context.Context, req KondanganListRequest) (*KondanganListResponse, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 10
	}

	kondangans, total, err := s.repo.List(ctx, req)
	if err != nil {
		return nil, err
	}

	var items []KondanganResponse
	for _, k := range kondangans {
		items = append(items, *s.mapToResponse(&k))
	}

	if items == nil {
		items = []KondanganResponse{}
	}

	totalPages := int((total + int64(req.PageSize) - 1) / int64(req.PageSize))

	return &KondanganListResponse{
		Items:      items,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *service) Update(ctx context.Context, id string, req UpdateKondanganRequest) (*KondanganResponse, error) {
	kondangan, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.CoupleName != "" {
		kondangan.CoupleName = req.CoupleName
	}
	if req.RelationID != nil {
		kondangan.RelationID = *req.RelationID
	}
	if req.Side != "" {
		kondangan.Side = req.Side
	}
	if req.GiftType != "" {
		kondangan.GiftType = req.GiftType
	}
	if req.GiftName != nil {
		kondangan.GiftName = req.GiftName
	}
	if req.Nominal != nil {
		kondangan.Nominal = req.Nominal
	}

	if err := s.repo.Update(ctx, kondangan); err != nil {
		return nil, err
	}

	return s.mapToResponse(kondangan), nil
}

func (s *service) Delete(ctx context.Context, id string) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	return s.repo.Delete(ctx, id)
}

func (s *service) GetStats(ctx context.Context) (*KondanganStatsResponse, error) {
	stats, err := s.repo.GetStats(ctx)
	if err != nil {
		return nil, err
	}

	return &stats, nil
}

func (s *service) CreateRelation(ctx context.Context, req CreateKondanganRelationRequest) (*KondanganRelationResponse, error) {
	relation := &models.KondanganRelation{
		Name: req.Name,
	}
	if err := s.repo.CreateRelation(ctx, relation); err != nil {
		return nil, err
	}
	return s.mapRelationToResponse(relation), nil
}

func (s *service) DeleteRelation(ctx context.Context, id int) error {
	return s.repo.DeleteRelation(ctx, id)
}

func (s *service) ListRelations(ctx context.Context) ([]KondanganRelationResponse, error) {
	relations, err := s.repo.ListRelations(ctx)
	if err != nil {
		return nil, err
	}
	var res []KondanganRelationResponse
	for _, r := range relations {
		res = append(res, *s.mapRelationToResponse(&r))
	}
	if res == nil {
		res = []KondanganRelationResponse{}
	}
	return res, nil
}

func (s *service) mapToResponse(k *models.Kondangan) *KondanganResponse {
	return &KondanganResponse{
		ID:         k.ID,
		CoupleName: k.CoupleName,
		RelationID: k.RelationID,
		Relation:   k.Relation.Name,
		Side:       k.Side,
		GiftType:   k.GiftType,
		GiftName:   k.GiftName,
		Nominal:    k.Nominal,
		CreatedAt:  k.CreatedAt,
		UpdatedAt:  k.UpdatedAt,
	}
}

func (s *service) mapRelationToResponse(r *models.KondanganRelation) *KondanganRelationResponse {
	return &KondanganRelationResponse{
		ID:        r.ID,
		Name:      r.Name,
		CreatedAt: r.CreatedAt,
		UpdatedAt: r.UpdatedAt,
	}
}
